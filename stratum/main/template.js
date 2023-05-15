const Algorithms = require('./algorithms');
const Sha3 = require('sha3');
const Transactions = require('./transactions');
const fastRoot = require('merkle-lib/fastRoot');
const utils = require('./utils');

////////////////////////////////////////////////////////////////////////////////

// Main Template Function
const Template = function(jobId, config, rpcData, placeholder) {

  const _this = this;
  this.jobId = jobId;
  this.config = config;
  this.rpcData = rpcData;
  this.submissions = [];

  // Template Variables
  this.target = _this.rpcData.target ? BigInt(`0x${ _this.rpcData.target }`) : utils.bigIntFromBitsHex(_this.rpcData.bits);
  this.difficulty = parseFloat((Algorithms.kawpow.diff / Number(_this.target)).toFixed(9));
  this.generation = new Transactions(config, rpcData).handleGeneration(placeholder);

  // Manage Serializing Block Headers
  this.handleHeader = function(version, merkleRoot, nTime) {

    // Initialize Header/Pointer
    let position = 0;
    let header = Buffer.alloc(80);

    // Append Data to Buffer
    header.write(utils.packUInt32BE(_this.rpcData.height).toString('hex'), position, 4, 'hex');
    header.write(_this.rpcData.bits, position += 4, 4, 'hex');
    header.write(nTime, position += 4, 4, 'hex');
    header.write(utils.reverseBuffer(merkleRoot).toString('hex'), position += 4, 32, 'hex');
    header.write(_this.rpcData.previousblockhash, position += 32, 32, 'hex');
    header.writeUInt32BE(version, position + 32, 4);
    header = utils.reverseBuffer(header);
    return header;
  };

  // Manage Serializing Block Coinbase
  this.handleCoinbase = function(extraNonce1) {
    return Buffer.concat([
      _this.generation[0],
      extraNonce1,
      _this.generation[1],
    ]);
  };

  // Manage Serializing Block Objects
  this.handleBlocks = function(header, coinbase, nonce, mixHash) {
    return Buffer.concat([
      header,
      nonce,
      utils.reverseBuffer(mixHash),
      utils.varIntBuffer(_this.rpcData.transactions.length + 1),
      coinbase,
      Buffer.concat(_this.rpcData.transactions.map((tx) => Buffer.from(tx.data, 'hex'))),
    ]);
  };

  // Manage Job Parameters for Clients
  this.handleParameters = function(client, cleanJobs) {

    // Check if Client has ExtraNonce Set
    if (!client.extraNonce1) {
      client.extraNonce1 = utils.extraNonceCounter(2).next();
    }

    // Establish Hashing Algorithms
    const headerDigest = Algorithms.sha256d.hash();
    const coinbaseDigest = Algorithms.sha256d.hash();

    // Calculate Epoch Length
    const epochLength = Math.floor(this.rpcData.height / Algorithms.kawpow.epochLength);
    const extraNonce1Buffer = Buffer.from(client.extraNonce1, 'hex');

    // Pad Difficulty to Broadcast
    let zeroPad = '';
    const adjPow = Algorithms.kawpow.diff / _this.difficulty;
    if ((64 - adjPow.toString(16).length) !== 0) {
      zeroPad = '0';
      zeroPad = zeroPad.repeat((64 - (adjPow.toString(16).length)));
    }

    // Generate Coinbase Buffer
    const coinbaseBuffer = _this.handleCoinbase(extraNonce1Buffer);
    const coinbaseHash = coinbaseDigest(coinbaseBuffer);
    const hashes = utils.convertHashToBuffer(_this.rpcData.transactions);
    const transactions = [coinbaseHash].concat(hashes);
    const merkleRoot = fastRoot(transactions, utils.sha256d);

    // Generate Seed Hash Buffer
    let sha3Hash = new Sha3.SHA3Hash(256);
    let seedHashBuffer = Buffer.alloc(32);
    for (let i = 0; i < epochLength; i++) {
      sha3Hash = new Sha3.SHA3Hash(256);
      sha3Hash.update(seedHashBuffer);
      seedHashBuffer = sha3Hash.digest();
    }

    // Generate Block Header Hash
    const version = _this.rpcData.version;
    const nTime = utils.packUInt32BE(_this.rpcData.curtime).toString('hex');
    const target = (zeroPad + adjPow.toString(16)).substr(0, 64);
    const headerBuffer = _this.handleHeader(version, merkleRoot, nTime);
    const headerHashBuffer = utils.reverseBuffer(headerDigest(headerBuffer));

    return [
      _this.jobId,
      headerHashBuffer.toString('hex'),
      seedHashBuffer.toString('hex'),
      target,
      cleanJobs,
      _this.rpcData.height,
      _this.rpcData.bits
    ];
  };

  // Check Previous Submissions for Duplicates
  this.handleSubmissions = function(header) {
    const submission = header.join('').toLowerCase();
    if (_this.submissions.indexOf(submission) === -1) {
      _this.submissions.push(submission);
      return true;
    }
    return false;
  };
};

module.exports = Template;
