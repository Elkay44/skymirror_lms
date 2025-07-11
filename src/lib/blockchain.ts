import { ethers } from 'ethers';

const CERTIFICATE_ABI = [
  'function issueCertificate(address student, string memory studentName, string memory courseName, string memory ipfsHash) public returns (uint256)',
  'function getCertificate(uint256 tokenId) public view returns (string memory studentName, string memory courseName, uint256 completionDate, string memory ipfsHash)',
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
];

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private wallet: ethers.Wallet;

  constructor() {
    // Connect to Ethereum network (e.g., Sepolia testnet)
    this.provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    
    // Initialize wallet and contract
    const contractAddress = process.env.CERTIFICATE_CONTRACT_ADDRESS as string;
    this.wallet = new ethers.Wallet(process.env.ETHEREUM_PRIVATE_KEY as string, this.provider);
    this.contract = new ethers.Contract(contractAddress, CERTIFICATE_ABI, this.wallet);
  }

  async issueCertificate(
    studentAddress: string,
    studentName: string,
    courseName: string,
    ipfsHash: string
  ): Promise<string> {
    try {
      const tx = await this.contract.issueCertificate(
        studentAddress,
        studentName,
        courseName,
        ipfsHash
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: ethers.Log) => {
        try {
          const parsedLog = this.contract.interface.parseLog({
            data: log.data,
            topics: log.topics
          });
          return parsedLog?.name === 'Transfer';
        } catch {
          return false;
        }
      });
      
      if (!event) throw new Error('Transfer event not found');
      const parsedLog = this.contract.interface.parseLog({
        data: event.data,
        topics: event.topics
      });
      if (!parsedLog) throw new Error('Failed to parse transfer event');
      return parsedLog.args[2].toString(); // tokenId is the third argument
    } catch (error) {
      console.error('Error issuing certificate:', error);
      throw error;
    }
  }

  async getCertificate(tokenId: string) {
    try {
      const cert = await this.contract.getCertificate(tokenId);
      return {
        studentName: cert[0],
        courseName: cert[1],
        completionDate: new Date(Number(cert[2]) * 1000),
        ipfsHash: cert[3]
      };
    } catch (error) {
      console.error('Error getting certificate:', error);
      throw error;
    }
  }

  async verifyCertificate(tokenId: string, studentAddress: string): Promise<boolean> {
    try {
      const owner = await this.contract.ownerOf(tokenId);
      return owner.toLowerCase() === studentAddress.toLowerCase();
    } catch (error) {
      console.error('Error verifying certificate:', error);
      return false;
    }
  }
}
