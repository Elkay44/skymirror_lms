/**
 * Configuration for the Skymirror Academy certification smart contract
 * This file contains network settings, contract addresses, and ABI.
 */

// Contract deployment addresses on different networks
export const CONTRACT_ADDRESSES = {
  // For local development and testing
  localhost: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  // Ethereum testnets
  goerli: process.env.CERTIFICATION_CONTRACT_GOERLI || '',
  sepolia: process.env.CERTIFICATION_CONTRACT_SEPOLIA || '',
  // For production deployment
  mainnet: process.env.CERTIFICATION_CONTRACT_MAINNET || '',
  // Polygon network for lower gas fees
  polygon: process.env.CERTIFICATION_CONTRACT_POLYGON || '',
  polygonMumbai: process.env.CERTIFICATION_CONTRACT_POLYGON_MUMBAI || '',
};

// Default network for the current environment
export const DEFAULT_NETWORK = process.env.NODE_ENV === 'production' 
  ? (process.env.BLOCKCHAIN_NETWORK || 'polygon')
  : (process.env.BLOCKCHAIN_NETWORK || 'localhost');

// RPC provider URLs for different networks
export const RPC_PROVIDERS = {
  localhost: 'http://localhost:8545',
  goerli: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY || ''}`,
  sepolia: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY || ''}`,
  mainnet: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY || ''}`,
  polygon: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_API_KEY || ''}`,
  polygonMumbai: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_API_KEY || ''}`,
};

// IPFS configuration for storing certificate metadata
export const IPFS_CONFIG = {
  gateway: 'https://ipfs.io/ipfs/',
  // We'll use pinata.cloud for pinning files to IPFS
  pinata: {
    apiKey: process.env.PINATA_API_KEY || '',
    secretKey: process.env.PINATA_SECRET_KEY || '',
    jwt: process.env.PINATA_JWT || '',
  },
};

// Simplified ABI for the certification contract (to be replaced with actual ABI)
export const CONTRACT_ABI = [
  // ERC721 standard functions
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  
  // Custom certification functions
  "function issueCertificate(address student, string memory studentName, string memory studentId, string memory courseName, string memory courseId, bytes32 projectsHash, string memory tokenURI, uint256 expiresAt) returns (uint256)",
  "function getCertificate(uint256 tokenId) view returns (string memory studentName, string memory courseName, string memory courseId, string memory studentId, uint256 issuedAt, uint256 expiresAt, bool isRevoked, bytes32 projectsHash)",
  "function verifyCertificate(uint256 tokenId) view returns (bool)",
  "function verifyProjects(uint256 tokenId, string memory projectData) view returns (bool)",
  "function revokeCertificate(uint256 tokenId, string memory reason)",
  "function getStudentCertificates(address student) view returns (uint256[] memory)",
  "function getCourseCertificates(string memory courseId) view returns (uint256[] memory)",
  
  // Events
  "event CertificateIssued(uint256 indexed tokenId, address indexed student, string courseId)",
  "event CertificateRevoked(uint256 indexed tokenId, string reason)",
  "event ProjectsVerified(uint256 indexed tokenId, bytes32 projectsHash)"
];
