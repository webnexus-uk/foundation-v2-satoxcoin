const Transactions = require('../main/transactions');
const config = require('../../configs/example');
const testdata = require('../../daemon/test/daemon.mock');

config.primary.address = 'RHUC17zAVjNqXDtkqwLPRvQ2XgoRZsXeeG';
config.primary.recipients = [];

const auxiliaryConfig = {
  'enabled': false,
  'coin': {
    'header': 'fabe6d6d',
  }
};

const auxiliaryData = {
  'chainid': 1,
  'hash': '17a35a38e70cd01488e0d5ece6ded04a9bc8125865471d36b9d5c47a08a5907c',
};

const extraNonce = Buffer.from('f000000ff111111f', 'hex');

////////////////////////////////////////////////////////////////////////////////

describe('Test transactions functionality', () => {

  let configCopy, rpcDataCopy;
  beforeEach(() => {
    configCopy = JSON.parse(JSON.stringify(config));
    rpcDataCopy = JSON.parse(JSON.stringify(testdata.getBlockTemplate()));
  });

  test('Test main transaction builder [1]', () => {
    const transaction = new Transactions(configCopy, rpcDataCopy).handleGeneration(extraNonce);
    expect(transaction[0].slice(0, -5)).toStrictEqual(Buffer.from('01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff0f5104', 'hex'));
    expect(transaction[1]).toStrictEqual(Buffer.from('0000000002902f5009000000001976a91459d584c2da3735f24af4ed3eb8e2abeb63fbffd688ac0000000000000000266a24aa21a9ede2f61c3f71d1defd3fa999dfa36953755c690689799962b48bebd836974e8cf900000000', 'hex'));
  });

  test('Test main transaction builder [2]', () => {
    rpcDataCopy.coinbasetxn = {};
    rpcDataCopy.coinbasetxn.data = '0500008085202';
    const transaction = new Transactions(configCopy, rpcDataCopy).handleGeneration(extraNonce);
    expect(transaction[0].slice(0, -5)).toStrictEqual(Buffer.from('05000080010000000000000000000000000000000000000000000000000000000000000000ffffffff0f5104', 'hex'));
    expect(transaction[1]).toStrictEqual(Buffer.from('0000000002902f5009000000001976a91459d584c2da3735f24af4ed3eb8e2abeb63fbffd688ac0000000000000000266a24aa21a9ede2f61c3f71d1defd3fa999dfa36953755c690689799962b48bebd836974e8cf900000000', 'hex'));
  });

  test('Test main transaction builder [3]', () => {
    configCopy.primary.recipients.push({ address: 'RHUC17zAVjNqXDtkqwLPRvQ2XgoRZsXeeG', percentage: 0.05 });
    const transaction = new Transactions(configCopy, rpcDataCopy).handleGeneration(extraNonce);
    expect(transaction[0].slice(0, -5)).toStrictEqual(Buffer.from('01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff0f5104', 'hex'));
    expect(transaction[1]).toStrictEqual(Buffer.from('0000000003fcf9d808000000001976a91459d584c2da3735f24af4ed3eb8e2abeb63fbffd688ac94357700000000001976a91459d584c2da3735f24af4ed3eb8e2abeb63fbffd688ac0000000000000000266a24aa21a9ede2f61c3f71d1defd3fa999dfa36953755c690689799962b48bebd836974e8cf900000000', 'hex'));
  });

  test('Test main transaction builder [4]', () => {
    configCopy.primary.recipients.push({ address: 'RHUC17zAVjNqXDtkqwLPRvQ2XgoRZsXeeG', percentage: 0.05 });
    configCopy.primary.recipients.push({ address: 'RHUC17zAVjNqXDtkqwLPRvQ2XgoRZsXeeG', percentage: 0.05 });
    const transaction = new Transactions(configCopy, rpcDataCopy).handleGeneration(extraNonce);
    expect(transaction[0].slice(0, -5)).toStrictEqual(Buffer.from('01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff0f5104', 'hex'));
    expect(transaction[1]).toStrictEqual(Buffer.from('000000000468c46108000000001976a91459d584c2da3735f24af4ed3eb8e2abeb63fbffd688ac94357700000000001976a91459d584c2da3735f24af4ed3eb8e2abeb63fbffd688ac94357700000000001976a91459d584c2da3735f24af4ed3eb8e2abeb63fbffd688ac0000000000000000266a24aa21a9ede2f61c3f71d1defd3fa999dfa36953755c690689799962b48bebd836974e8cf900000000', 'hex'));
  });

  test('Test main transaction builder [5]', () => {
    rpcDataCopy.coinbaseaux.flags = 'test';
    const transaction = new Transactions(configCopy, rpcDataCopy).handleGeneration(extraNonce);
    expect(transaction[0].slice(0, -5)).toStrictEqual(Buffer.from('01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff0f5104', 'hex'));
    expect(transaction[1]).toStrictEqual(Buffer.from('0000000002902f5009000000001976a91459d584c2da3735f24af4ed3eb8e2abeb63fbffd688ac0000000000000000266a24aa21a9ede2f61c3f71d1defd3fa999dfa36953755c690689799962b48bebd836974e8cf900000000', 'hex'));
  });

  test('Test main transaction builder [6]', () => {
    delete rpcDataCopy.default_witness_commitment;
    const transaction = new Transactions(configCopy, rpcDataCopy).handleGeneration(extraNonce);
    expect(transaction[0].slice(0, -5)).toStrictEqual(Buffer.from('01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff0f5104', 'hex'));
    expect(transaction[1]).toStrictEqual(Buffer.from('0000000001902f5009000000001976a91459d584c2da3735f24af4ed3eb8e2abeb63fbffd688ac00000000', 'hex'));
  });

  test('Test main transaction builder [7]', () => {
    rpcDataCopy.auxData = auxiliaryData;
    configCopy.auxiliary = auxiliaryConfig;
    configCopy.auxiliary.enabled = true;
    const transaction = new Transactions(configCopy, rpcDataCopy).handleGeneration(extraNonce);
    expect(transaction[0].slice(0, 44)).toStrictEqual(Buffer.from('01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff3b5104', 'hex'));
    expect(transaction[0].slice(49, 53)).toStrictEqual(Buffer.from('fabe6d6d', 'hex'));
    expect(transaction[0].slice(53)).toStrictEqual(Buffer.from('17a35a38e70cd01488e0d5ece6ded04a9bc8125865471d36b9d5c47a08a5907c0100000000000000', 'hex'));
    expect(transaction[1]).toStrictEqual(Buffer.from('0000000002902f5009000000001976a91459d584c2da3735f24af4ed3eb8e2abeb63fbffd688ac0000000000000000266a24aa21a9ede2f61c3f71d1defd3fa999dfa36953755c690689799962b48bebd836974e8cf900000000', 'hex'));
  });

  test('Test main transaction builder [8]', () => {
    configCopy.settings.testnet = true;
    configCopy.primary.address = 'mxQ4kX7k8c84JgNb6p8kbmxZD889YytnDT';
    const transaction = new Transactions(configCopy, rpcDataCopy).handleGeneration(extraNonce);
    expect(transaction[0].slice(0, -5)).toStrictEqual(Buffer.from('01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff0f5104', 'hex'));
    expect(transaction[1]).toStrictEqual(Buffer.from('0000000002902f5009000000001976a914b92c9db55f187b0d7f11e7c2d82e1cdc74301ce388ac0000000000000000266a24aa21a9ede2f61c3f71d1defd3fa999dfa36953755c690689799962b48bebd836974e8cf900000000', 'hex'));
  });
});
