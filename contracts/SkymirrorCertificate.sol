// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title SkymirrorCertificate
 * @dev ERC721 token representing educational certifications from SkyMirror Academy
 * with project completion verification and revocation capabilities
 */
contract SkymirrorCertificate is ERC721, ERC721URIStorage, AccessControl {
    using Counters for Counters.Counter;
    using ECDSA for bytes32;

    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    Counters.Counter private _tokenIds;
    
    struct Certificate {
        string studentName;
        string courseName;
        string courseId;
        string studentId;
        uint256 issuedAt;
        uint256 expiresAt;      // 0 means doesn't expire
        bool isRevoked;
        bytes32 projectsHash;   // Hash of completed projects data
    }
    
    // Certificate storage
    mapping(uint256 => Certificate) public certificates;
    
    // Student address to their token IDs
    mapping(address => uint256[]) public studentCertificates;
    
    // Course ID to token IDs
    mapping(string => uint256[]) public courseCertificates;
    
    // Events
    event CertificateIssued(uint256 indexed tokenId, address indexed student, string courseId);
    event CertificateRevoked(uint256 indexed tokenId, string reason);
    event ProjectsVerified(uint256 indexed tokenId, bytes32 projectsHash);

    constructor() ERC721("SkymirrorCertificate", "SKYC") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    /**
     * @dev Issues a certificate to a student who has completed all required projects
     * @param student Address of the student receiving the certificate
     * @param studentName Name of the student
     * @param studentId Student's ID in the system
     * @param courseName Name of the completed course
     * @param courseId ID of the completed course
     * @param projectsHash Hash of all verified completed projects
     * @param tokenURI IPFS URI containing certificate metadata
     * @param expiresAt Optional expiration timestamp (0 for no expiration)
     */
    function issueCertificate(
        address student,
        string memory studentName,
        string memory studentId,
        string memory courseName,
        string memory courseId,
        bytes32 projectsHash,
        string memory tokenURI,
        uint256 expiresAt
    ) public onlyRole(ISSUER_ROLE) returns (uint256) {
        _tokenIds.increment();
        uint256 newCertificateId = _tokenIds.current();
        
        _safeMint(student, newCertificateId);
        _setTokenURI(newCertificateId, tokenURI);
        
        certificates[newCertificateId] = Certificate({
            studentName: studentName,
            courseName: courseName,
            courseId: courseId,
            studentId: studentId,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            isRevoked: false,
            projectsHash: projectsHash
        });
        
        studentCertificates[student].push(newCertificateId);
        courseCertificates[courseId].push(newCertificateId);
        
        emit CertificateIssued(newCertificateId, student, courseId);
        emit ProjectsVerified(newCertificateId, projectsHash);
        
        return newCertificateId;
    }
    
    /**
     * @dev Revokes a certificate
     * @param tokenId ID of the certificate to revoke
     * @param reason Reason for revocation
     */
    function revokeCertificate(uint256 tokenId, string memory reason) 
        public 
        onlyRole(ISSUER_ROLE) 
    {
        require(_exists(tokenId), "Certificate does not exist");
        require(!certificates[tokenId].isRevoked, "Certificate already revoked");
        
        certificates[tokenId].isRevoked = true;
        emit CertificateRevoked(tokenId, reason);
    }

    /**
     * @dev Gets all certificate details
     * @param tokenId Token ID of the certificate
     */
    function getCertificate(uint256 tokenId) public view returns (
        string memory studentName,
        string memory courseName,
        string memory courseId,
        string memory studentId,
        uint256 issuedAt,
        uint256 expiresAt,
        bool isRevoked,
        bytes32 projectsHash
    ) {
        require(_exists(tokenId), "Certificate does not exist");
        Certificate memory cert = certificates[tokenId];
        
        return (
            cert.studentName,
            cert.courseName,
            cert.courseId,
            cert.studentId,
            cert.issuedAt,
            cert.expiresAt,
            cert.isRevoked,
            cert.projectsHash
        );
    }
    
    /**
     * @dev Verify if a certificate is valid and not expired or revoked
     * @param tokenId Token ID of the certificate to verify
     */
    function verifyCertificate(uint256 tokenId) public view returns (bool) {
        if (!_exists(tokenId)) return false;
        
        Certificate memory cert = certificates[tokenId];
        
        if (cert.isRevoked) return false;
        if (cert.expiresAt != 0 && block.timestamp > cert.expiresAt) return false;
        
        return true;
    }
    
    /**
     * @dev Verify certificate with project completion proof
     * @param tokenId Token ID of the certificate
     * @param projectData Raw project completion data that should hash to stored projectsHash
     */
    function verifyProjects(uint256 tokenId, string memory projectData) public view returns (bool) {
        require(_exists(tokenId), "Certificate does not exist");
        Certificate memory cert = certificates[tokenId];
        
        bytes32 computedHash = keccak256(abi.encodePacked(projectData));
        return computedHash == cert.projectsHash;
    }
    
    /**
     * @dev Get all certificates owned by a student
     * @param student Address of the student
     */
    function getStudentCertificates(address student) public view returns (uint256[] memory) {
        return studentCertificates[student];
    }
    
    /**
     * @dev Get all certificates issued for a specific course
     * @param courseId ID of the course
     */
    function getCourseCertificates(string memory courseId) public view returns (uint256[] memory) {
        return courseCertificates[courseId];
    }

    // Required overrides for ERC721URIStorage
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
