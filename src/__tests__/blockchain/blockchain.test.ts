import { BlockchainService } from '@/lib/blockchain';
import { ethers } from 'ethers';

// Mock ethers
jest.mock('ethers', () => {
  const originalModule = jest.requireActual('ethers');
  return {
    ...originalModule,
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getNetwork: jest.fn().mockResolvedValue({ chainId: 11155111 }) // Sepolia testnet
    })),
    Contract: jest.fn().mockImplementation(() => ({
      issueCertificate: jest.fn().mockImplementation(() => ({
        wait: jest.fn().mockResolvedValue({
          logs: [{
            data: '0x',
            topics: [
              ethers.id('Transfer(address,address,uint256)'),
              '0x0000000000000000000000000000000000000000',
              '0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
              '0x0000000000000000000000000000000000000000000000000000000000000001'
            ]
          }]
        })
      })),
      getCertificate: jest.fn().mockResolvedValue([
        'John Doe',
        'Web Development',
        ethers.getBigInt('1682956800'), // May 1, 2023
        'QmHash123'
      ]),
      ownerOf: jest.fn().mockResolvedValue('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'),
      interface: {
        parseLog: jest.fn().mockReturnValue({
          name: 'Transfer',
          args: ['0x0', '0xf39...', ethers.getBigInt('1')]
        })
      }
    })),
    Wallet: jest.fn().mockImplementation(() => ({
      address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'
    }))
  };
});

describe('BlockchainService', () => {
  let service: BlockchainService;

  beforeEach(() => {
    service = new BlockchainService();
  });

  it('should issue a certificate', async () => {
    const tokenId = await service.issueCertificate(
      '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      'John Doe',
      'Web Development',
      'QmHash123'
    );

    expect(tokenId).toBe('1');
  });

  it('should get certificate details', async () => {
    const cert = await service.getCertificate('1');

    expect(cert).toEqual({
      studentName: 'John Doe',
      courseName: 'Web Development',
      completionDate: new Date('2023-05-01T00:00:00.000Z'),
      ipfsHash: 'QmHash123'
    });
  });

  it('should verify certificate ownership', async () => {
    const isValid = await service.verifyCertificate(
      '1',
      '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'
    );

    expect(isValid).toBe(true);
  });

  it('should return false for invalid certificate ownership', async () => {
    const isValid = await service.verifyCertificate(
      '1',
      '0x70997970c51812dc3a010c7d01b50e0d17dc79c8'
    );

    expect(isValid).toBe(false);
  });
});
