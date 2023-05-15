const Manager = require('../main/manager');
const config = require('../../configs/example');
const configMain = require('../../configs/main');
const events = require('events');
const testdata = require('../../daemon/test/daemon.mock');

config.primary.address = 'RHUC17zAVjNqXDtkqwLPRvQ2XgoRZsXeeG';
config.primary.recipients = [];

////////////////////////////////////////////////////////////////////////////////

function mockSocket() {
  const socket = new events.EventEmitter();
  socket.remoteAddress = '127.0.0.1',
  socket.destroy = () => {};
  socket.setEncoding = () => {};
  socket.setKeepAlive = () => {};
  socket.write = (data) => {
    socket.emit('log', data);
  };
  return socket;
}

function mockClient() {
  const socket = mockSocket();
  const client = new events.EventEmitter();
  client.id = 'test';
  client.addrPrimary = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2';
  client.addrAuxiliary = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2';
  client.previousDifficulty = 0;
  client.difficulty = 1,
  client.extraNonce1 = 0,
  client.socket = socket;
  client.socket.localPort = 3002;
  client.sendLabel = () => {
    return 'client [example]';
  };
  client.broadcastMiningJob = () => {};
  client.broadcastDifficulty = () => {};
  return client;
}

////////////////////////////////////////////////////////////////////////////////

describe('Test manager functionality', () => {

  let configCopy, configMainCopy, rpcDataCopy;
  beforeEach(() => {
    configCopy = JSON.parse(JSON.stringify(config));
    configMainCopy = JSON.parse(JSON.stringify(configMain));
    rpcDataCopy = JSON.parse(JSON.stringify(testdata.getBlockTemplate()));
  });

  test('Test initial manager calculations', () => {
    const manager = new Manager(configCopy, configMainCopy);
    expect(manager.extraNonceCounter.size).toBe(2);
    expect(manager.extraNonceCounter.next().length).toBe(4);
    expect(manager.extraNoncePlaceholder).toStrictEqual(Buffer.from('f000', 'hex'));
    expect(manager.extraNonce2Size).toBe(0);
  });

  test('Test template updates given updated blockTemplate', () => {
    const manager = new Manager(configCopy, configMainCopy);
    const response1 = manager.handleTemplate(rpcDataCopy);
    expect(response1).toBe(true);
  });

  test('Test template updates given new blockTemplate [1]', () => {
    const manager = new Manager(configCopy, configMainCopy);
    const response1 = manager.handleTemplate(rpcDataCopy, false);
    const response2 = manager.handleTemplate(rpcDataCopy, false);
    expect(response1).toBe(true);
    expect(response2).toBe(false);
  });

  test('Test template updates given new blockTemplate [2]', () => {
    const manager = new Manager(configCopy, configMainCopy);
    const response1 = manager.handleTemplate(rpcDataCopy, false);
    rpcDataCopy.previousblockhash = '8719aefb83ef6583bd4c808bbe7d49b629a60b375fc6e36bee039530bc7727e2';
    const response2 = manager.handleTemplate(rpcDataCopy, false);
    expect(response1).toBe(true);
    expect(response2).toBe(true);
  });

  test('Test template updates given new blockTemplate [3]', () => {
    const manager = new Manager(configCopy, configMainCopy);
    const response1 = manager.handleTemplate(rpcDataCopy, false);
    rpcDataCopy.previousblockhash = '8719aefb83ef6583bd4c808bbe7d49b629a60b375fc6e36bee039530bc7727e2';
    rpcDataCopy.height = 0;
    const response2 = manager.handleTemplate(rpcDataCopy, false);
    expect(response1).toBe(true);
    expect(response2).toBe(false);
  });

  test('Test share submission process [1]', () => {
    const manager = new Manager(configCopy, configMainCopy);
    manager.handleTemplate(rpcDataCopy, false);
    const submission = {
      extraNonce1: 0,
      nonce: '00',
      headerHash: '00',
      mixHash: '00',
    };
    const client = mockClient();
    const response = manager.handleShare(0, client, submission);
    expect(response.error[0]).toBe(21);
    expect(response.error[1]).toBe('job not found');
  });

  test('Test share submission process [2]', () => {
    const manager = new Manager(configCopy, configMainCopy);
    manager.handleTemplate(rpcDataCopy, false);
    const submission = {
      extraNonce1: 0,
      nonce: '00',
      headerHash: 'xxxx',
      mixHash: '00',
    };
    const client = mockClient();
    const response = manager.handleShare(1, client, submission);
    expect(response.error[0]).toBe(20);
    expect(response.error[1]).toBe('invalid header submission [1]');
  });

  test('Test share submission process [3]', () => {
    const manager = new Manager(configCopy, configMainCopy);
    manager.handleTemplate(rpcDataCopy, false);
    const submission = {
      extraNonce1: 0,
      nonce: '00',
      headerHash: '00',
      mixHash: 'xxxx',
    };
    const client = mockClient();
    const response = manager.handleShare(1, client, submission);
    expect(response.error[0]).toBe(20);
    expect(response.error[1]).toBe('invalid mixHash submission');
  });

  test('Test share submission process [4]', () => {
    const manager = new Manager(configCopy, configMainCopy);
    manager.handleTemplate(rpcDataCopy, false);
    const submission = {
      extraNonce1: 0,
      nonce: 'xxxx',
      headerHash: '00',
      mixHash: '00',
    };
    const client = mockClient();
    const response = manager.handleShare(1, client, submission);
    expect(response.error[0]).toBe(20);
    expect(response.error[1]).toBe('invalid nonce submission');
  });

  test('Test share submission process [5]', () => {
    const manager = new Manager(configCopy, configMainCopy);
    manager.handleTemplate(rpcDataCopy, false);
    const submission = {
      extraNonce1: 0,
      nonce: 'xxxx',
      headerHash: '00',
      mixHash: '00',
    };
    const client = mockClient();
    const response = manager.handleShare(1, client, submission);
    expect(response.error[0]).toBe(20);
    expect(response.error[1]).toBe('invalid nonce submission');
  });

  test('Test share submission process [6]', () => {
    const manager = new Manager(configCopy, configMainCopy);
    manager.handleTemplate(rpcDataCopy, false);
    const submission = {
      extraNonce1: '1952',
      nonce: '19522aaaad98a7ec',
      headerHash: '4c3ec261b8b84f36ffadad0f07b007748866d422c1c8006ccce526ad67088fe7',
      mixHash: '9d82ca253ae7011b8f9f2e12cba5a4373134197b89b5c9ecf6913f3c7d0bc45caa'
    };
    const client = mockClient();
    const response = manager.handleShare(1, client, submission);
    expect(response.error[0]).toBe(20);
    expect(response.error[1]).toBe('incorrect size of mixHash');
  });

  test('Test share submission process [7]', () => {
    const manager = new Manager(configCopy, configMainCopy);
    manager.handleTemplate(rpcDataCopy, false);
    const submission = {
      extraNonce1: '1952',
      nonce: '19522aaaad98a7ecaa',
      headerHash: '4c3ec261b8b84f36ffadad0f07b007748866d422c1c8006ccce526ad67088fe7',
      mixHash: '9d82ca253ae7011b8f9f2e12cba5a4373134197b89b5c9ecf6913f3c7d0bc45c'
    };
    const client = mockClient();
    const response = manager.handleShare(1, client, submission);
    expect(response.error[0]).toBe(20);
    expect(response.error[1]).toBe('incorrect size of nonce');
  });

  test('Test share submission process [8]', () => {
    const manager = new Manager(configCopy, configMainCopy);
    manager.handleTemplate(rpcDataCopy, false);
    const submission = {
      extraNonce1: '00',
      nonce: '19522aaaad98a7ec',
      headerHash: '4c3ec261b8b84f36ffadad0f07b007748866d422c1c8006ccce526ad67088fe7',
      mixHash: '9d82ca253ae7011b8f9f2e12cba5a4373134197b89b5c9ecf6913f3c7d0bc45c'
    };
    const client = mockClient();
    const response = manager.handleShare(1, client, submission);
    expect(response.error[0]).toBe(24);
    expect(response.error[1]).toBe('nonce out of worker range');
  });

  test('Test share submission process [9]', () => {
    const manager = new Manager(configCopy, configMainCopy);
    manager.handleTemplate(rpcDataCopy, false);
    const submission = {
      extraNonce1: 'b750',
      nonce: 'b7502aaaac75284c',
      headerHash: 'a940277ad64417e5d645d884522f66d733cfc91ab0a87b32d6400ed28c6b8f2e',
      mixHash: 'ab1957f31544c9a133eebccdd30dfefc3deda8ab3015aa12aac8b164346152ab'
    };
    const client = mockClient();
    client.addrPrimary = null;
    const response = manager.handleShare(1, client, submission);
    expect(response.error[0]).toBe(20);
    expect(response.error[1]).toBe('worker address isn\'t set properly');
  });

  test('Test share submission process [10]', () => {
    const manager = new Manager(configCopy, configMainCopy);
    manager.handleTemplate(rpcDataCopy, false);
    const submission = {
      extraNonce1: '1952',
      nonce: '19522aaaad98a7ec',
      headerHash: '4c3ec261b8b84f36ffadad0f07b007748866d422c1c8006ccce526ad67088fe7',
      mixHash: '9d82ca253ae7011b8f9f2e12cba5a4373134197b89b5c9ecf6913f3c7d0bc45c'
    };
    const client = mockClient();
    manager.handleShare(1, client, submission);
    const response = manager.handleShare(1, client, submission);
    expect(response.error[0]).toBe(22);
    expect(response.error[1]).toBe('duplicate share');
  });

  test('Test share submission process [10]', () => {
    const manager = new Manager(configCopy, configMainCopy);
    manager.handleTemplate(rpcDataCopy, false);
    const submission = {
      extraNonce1: '1952',
      nonce: '19522aaaad98a7ec',
      headerHash: '3c3ec261b8b84f36ffadad0f07b007748866d422c1c8006ccce526ad67088fe7',
      mixHash: '9d82ca253ae7011b8f9f2e12cba5a4373134197b89b5c9ecf6913f3c7d0bc45c'
    };
    const client = mockClient();
    const response = manager.handleShare(1, client, submission);
    expect(response.error[0]).toBe(20);
    expect(response.error[1]).toBe('invalid header submission [2]');
  });
});
