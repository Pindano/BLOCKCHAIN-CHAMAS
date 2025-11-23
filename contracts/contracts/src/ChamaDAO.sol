// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ChamaDAO {
    
    
    string public name;
    address public creator;
    uint256 public votingPeriod;
    uint256 public quorumPercentage;
    uint256 public totalMembers;
    
    // IPFS CID for chama constitution (contains ALL rules)
    string public constitutionCID;
    
    // EIP-712 Domain Separator for gasless operations
    bytes32 public DOMAIN_SEPARATOR;
    bytes32 public constant VOTE_TYPEHASH = keccak256(
        "Vote(uint256 proposalId,bool support,address voter,uint256 nonce)"
    );
    
  
    
    struct Member {
        address wallet;
        bool isActive;
       
    }
    
    // Universal Proposal 
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string proposalType;        // Human-readable: "Loan Request", "Contribution Report", etc.
        string ipfsDataCID;         // ALL proposal data stored on IPFS
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool passed;
        mapping(address => bool) hasVoted;
    }
    
  
    
    mapping(address => Member) public members;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public nonces; // For gasless operations
    
    address[] public memberList;
    uint256[] public proposalIds;
    
    uint256 public proposalCount;
    
    // All approved proposal CIDs (acts as permanent record)
    string[] public approvedProposalCIDs;

    
    event MemberAdded(address indexed member);
    event MemberRemoved(address indexed member);
    event ProposalCreated(
        uint256 indexed proposalId, 
        address indexed proposer, 
        string proposalType,
        string ipfsDataCID
    );
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalExecuted(uint256 indexed proposalId, bool passed, string ipfsDataCID);
    event ConstitutionUpdated(string newCID, string oldCID);
    
    
    
    modifier onlyMember() {
        require(members[msg.sender].isActive, "Not an active member");
        _;
    }
    
    
    
    constructor(
        string memory _name,
        address[] memory _initialMembers,
        uint256 _votingPeriod,
        uint256 _quorumPercentage,
        string memory _ipfsConstitutionCID,
        address _creator
    ) {
        name = _name;
        creator = _creator;
        votingPeriod = _votingPeriod;
        quorumPercentage = _quorumPercentage;
        constitutionCID = _ipfsConstitutionCID;
        
        // Setup EIP-712 domain
        DOMAIN_SEPARATOR = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes(_name)),
            keccak256(bytes("1")),
            block.chainid,
            address(this)
        ));
        
        // Add initial members
        for (uint256 i = 0; i < _initialMembers.length; i++) {
            _addMember(_initialMembers[i]);
        }
    }
   
    function createProposal(
        string memory _title,
        string memory _proposalType,
        string memory _ipfsDataCID
    ) external onlyMember returns (uint256) {
        proposalCount++;
        uint256 proposalId = proposalCount;
        
        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = _title;
        proposal.proposalType = _proposalType;
        proposal.ipfsDataCID = _ipfsDataCID;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + votingPeriod;
        
        proposalIds.push(proposalId);
        
        emit ProposalCreated(proposalId, msg.sender, _proposalType, _ipfsDataCID);
        return proposalId;
    }
    
    
    
    /**
     * @notice Vote with signature (gasless)
     */
    function voteWithSignature(
        uint256 _proposalId,
        bool _support,
        address _voter,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external {
        bytes32 structHash = keccak256(abi.encode(
            VOTE_TYPEHASH,
            _proposalId,
            _support,
            _voter,
            nonces[_voter]
        ));
        
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19\x01",
            DOMAIN_SEPARATOR,
            structHash
        ));
        
        address signer = ecrecover(digest, _v, _r, _s);
        require(signer == _voter, "Invalid signature");
        require(members[signer].isActive, "Not active member");
        
        nonces[_voter]++;
        _processVote(_proposalId, _voter, _support);
    }
    
    function _processVote(uint256 _proposalId, address _voter, bool _support) internal {
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp < proposal.endTime, "Voting ended");
        require(!proposal.hasVoted[_voter], "Already voted");
        
        proposal.hasVoted[_voter] = true;
        
        if (_support) {
            proposal.votesFor += 1;
        } else {
            proposal.votesAgainst += 1;
        }
        
        emit VoteCast(_proposalId, _voter, _support);
    }
    
    /**
     * @notice Execute proposal after voting ends
     * @dev Off-chain systems watch for ProposalExecuted event and process accordingly
     */
    function executeProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp >= proposal.endTime, "Voting not ended");
        require(!proposal.executed, "Already executed");
        
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        
        // Check quorum
        require(totalVotes * 100 >= totalMembers * quorumPercentage, "Quorum not met");
        
        proposal.executed = true;
        proposal.passed = proposal.votesFor > proposal.votesAgainst;
        
       
        
        emit ProposalExecuted(_proposalId, proposal.passed, proposal.ipfsDataCID);
    }
    
    
    
    function _isAddMemberProposal(string memory _type) internal pure returns (bool) {
        return keccak256(bytes(_type)) == keccak256(bytes("Add Member"));
    }
    
    function _isRemoveMemberProposal(string memory _type) internal pure returns (bool) {
        return keccak256(bytes(_type)) == keccak256(bytes("Remove Member"));
    }
    
    function _isUpdateConstitutionProposal(string memory _type) internal pure returns (bool) {
        return keccak256(bytes(_type)) == keccak256(bytes("Update Constitution"));
    }
    
    
    
    function _executeUpdateConstitution(string memory _ipfsDataCID) internal {
        // The IPFS CID IS the new constitution
        string memory oldCID = constitutionCID;
        constitutionCID = _ipfsDataCID;
        emit ConstitutionUpdated(_ipfsDataCID, oldCID);
    }
    
    /**
     * @notice Manual member management (called by off-chain service after proposal passes)
     * @dev Could be restricted to a trusted relayer address
     */
    function addMemberByProposal(address _member, uint256 _proposalId) external {
        // Verify proposal passed
        require(proposals[_proposalId].passed, "Proposal did not pass");
        require(proposals[_proposalId].executed, "Proposal not executed");
        require(_isAddMemberProposal(proposals[_proposalId].proposalType), "Not add member proposal");
        
        _addMember(_member);
    }
    
    function removeMemberByProposal(address _member, uint256 _proposalId) external {
        require(proposals[_proposalId].passed, "Proposal did not pass");
        require(proposals[_proposalId].executed, "Proposal not executed");
        require(_isRemoveMemberProposal(proposals[_proposalId].proposalType), "Not remove member proposal");
        
        _removeMember(_member);
    }
    

    
    function _addMember(address _member) internal {
        require(!members[_member].isActive, "Already member");
        
        members[_member] = Member({
            wallet: _member,
            isActive: true
        });
        
        memberList.push(_member);
        totalMembers++;
        
        emit MemberAdded(_member);
    }
    
    function _removeMember(address _member) internal {
        require(members[_member].isActive, "Not active");
        members[_member].isActive = false;
        totalMembers--;
        emit MemberRemoved(_member);
    }
    

    
    function isMember(address _account) external view returns (bool) {
        return members[_account].isActive;
    }
    
    function getProposalDetails(uint256 _proposalId) external view returns (
        address proposer,
        string memory title,
        string memory proposalType,
        string memory ipfsDataCID,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 startTime,
        uint256 endTime,
        bool executed,
        bool passed
    ) {
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.proposer,
            proposal.title,
            proposal.proposalType,
            proposal.ipfsDataCID,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.startTime,
            proposal.endTime,
            proposal.executed,
            proposal.passed
        );
    }
    
    function hasVoted(uint256 _proposalId, address _voter) external view returns (bool) {
        return proposals[_proposalId].hasVoted[_voter];
    }
    
    function getActiveProposals() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < proposalIds.length; i++) {
            if (block.timestamp < proposals[proposalIds[i]].endTime && 
                !proposals[proposalIds[i]].executed) {
                activeCount++;
            }
        }
        
        uint256[] memory activeProposals = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < proposalIds.length; i++) {
            if (block.timestamp < proposals[proposalIds[i]].endTime && 
                !proposals[proposalIds[i]].executed) {
                activeProposals[index] = proposalIds[i];
                index++;
            }
        }
        
        return activeProposals;
    }
    
    function getAllApprovedProposals() external view returns (string[] memory) {
        return approvedProposalCIDs;
    }
    
    function getMembersList() external view returns (address[] memory) {
        return memberList;
    }
    
    function getProposalsByType(string memory _proposalType) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < proposalIds.length; i++) {
            if (keccak256(bytes(proposals[proposalIds[i]].proposalType)) == keccak256(bytes(_proposalType))) {
                count++;
            }
        }
        
        uint256[] memory filtered = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < proposalIds.length; i++) {
            if (keccak256(bytes(proposals[proposalIds[i]].proposalType)) == keccak256(bytes(_proposalType))) {
                filtered[index] = proposalIds[i];
                index++;
            }
        }
        
        return filtered;
    }
}
