// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ChamaDAO {
    
    
    string public name;
    address public creator;
    uint256 public contributionAmount;
    uint256 public contributionFrequency; // in seconds (e.g., 7 days)
    uint256 public votingPeriod; // in seconds
    uint256 public quorumPercentage; // e.g., 75 for 75%
    uint256 public totalContributions;
    uint256 public totalMembers;
    
    // IPFS CID for chama constitution
    string public constitutionCID;
    
    // EIP-712 Domain Separator for gasless voting
    bytes32 public DOMAIN_SEPARATOR;
    bytes32 public constant VOTE_TYPEHASH = keccak256(
        "Vote(uint256 proposalId,bool support,address voter,uint256 nonce)"
    );
    
    struct Member {
        address wallet;
        uint256 totalContributions;
        uint256 votingPower;
        uint256 shares;
        uint256 lastContributionTime;
        bool isActive;
    }
    
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string ipfsDetailsCID; // Full proposal details on IPFS
        ProposalType proposalType;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool passed;
        bytes executionData;
        mapping(address => bool) hasVoted;
    }
    
   
    
  
    
    enum ProposalType {
        AddMember,
        RemoveMember,
        LoanRequest,
        ChangeContribution,
        ChangeRules,
        EmergencyWithdrawal,
        DistributeProfits,
        ApproveExpense
    }  
    
    mapping(address => Member) public members;
    mapping(uint256 => Proposal) public proposals;
  
    mapping(address => uint256) public nonces; // For gasless voting
    
    address[] public memberList;
    uint256[] public proposalIds;
   uint256[] public loanIds; 
    uint256 public proposalCount;
 
    struct Loan {
        uint256 id;
        address borrower;
        uint256 amount;
        uint256 interestRate; // basis points (e.g., 1000 = 10%)
        uint256 durationMonths;
        uint256 totalRepaid;
        uint256 startTime;
        uint256 nextPaymentDue;
        uint256 monthlyPayment;
        bool isActive;
        uint256 approvalProposalId;
        string ipfsAgreementCID; // Loan agreement on IPFS
    }

    
     uint256 public loanCount;   
    event MemberAdded(address indexed member, uint256 votingPower);
    event MemberRemoved(address indexed member);
    mapping(uint256 => Loan) public loans;
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, ProposalType proposalType);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId, bool passed);
    event ConstitutionUpdated(string newCID);
   event LoanApproved(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event LoanRepayment(uint256 indexed loanId, uint256 amount, uint256 remainingBalance); 
    
    modifier onlyMember() {
        require(members[msg.sender].isActive, "Not an active member");
        _;
    }
    
    modifier onlyCreator() {
        require(msg.sender == creator, "Only creator");
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
            _addMember(_initialMembers[i], 1);
        }
    }
           
    
    function createProposal(
        string memory _title,
        string memory _ipfsDetailsCID,
        ProposalType _proposalType,
        bytes memory _executionData
    ) external onlyMember returns (uint256) {
        proposalCount++;
        uint256 proposalId = proposalCount;
        
        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = _title;
        proposal.ipfsDetailsCID = _ipfsDetailsCID;
        proposal.proposalType = _proposalType;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + votingPeriod;
        proposal.executionData = _executionData;
        
        proposalIds.push(proposalId);
        
        emit ProposalCreated(proposalId, msg.sender, _proposalType);
        return proposalId;
    }
    
    
    
    // Gasless voting with EIP-712 signature
    function voteWithSignature(
        uint256 _proposalId,
        bool _support,
        address _voter,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external {
        // Verify signature
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
        
        uint256 votingPower = members[_voter].votingPower;
        proposal.hasVoted[_voter] = true;
        
        if (_support) {
            proposal.votesFor += votingPower;
        } else {
            proposal.votesAgainst += votingPower;
        }
        
        emit VoteCast(_proposalId, _voter, _support, votingPower);
    }
    
    function executeProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp >= proposal.endTime, "Voting not ended");
        require(!proposal.executed, "Already executed");
        
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        uint256 totalPower = _getTotalVotingPower();
        
        // Check quorum
        require(totalVotes * 100 >= totalPower * quorumPercentage, "Quorum not met");
        
        proposal.executed = true;
        proposal.passed = proposal.votesFor > proposal.votesAgainst;
        
        if (proposal.passed) {
            _executeProposalLogic(proposal);
        }
        
        emit ProposalExecuted(_proposalId, proposal.passed);
    }
    
    function _executeProposalLogic(Proposal storage _proposal) internal {
        if (_proposal.proposalType == ProposalType.AddMember) {
            (address newMember, uint256 votingPower) = 
                abi.decode(_proposal.executionData, (address, uint256));
            _addMember(newMember, votingPower);
        } 
        else if (_proposal.proposalType == ProposalType.RemoveMember) {
            address memberToRemove = abi.decode(_proposal.executionData, (address));
            _removeMember(memberToRemove);
        }
        else if (_proposal.proposalType == ProposalType.LoanRequest) {
            (address borrower, uint256 amount, uint256 interestRate, 
             uint256 duration, string memory agreementCID) = 
                abi.decode(_proposal.executionData, (address, uint256, uint256, uint256, string));
            _approveLoan(borrower, amount, interestRate, duration, _proposal.id, agreementCID);
        }
        else if (_proposal.proposalType == ProposalType.ChangeContribution) {
            uint256 newAmount = abi.decode(_proposal.executionData, (uint256));
            contributionAmount = newAmount;
        }
    }
    function _approveLoan(
        address _borrower,
        uint256 _amount,
        uint256 _interestRate,
        uint256 _durationMonths,
        uint256 _proposalId,
        string memory _agreementCID
    ) internal {
        loanCount++;
        uint256 loanId = loanCount;
        
        // Calculate monthly payment (simplified - use proper amortization in production)
        uint256 totalAmount = _amount + (_amount * _interestRate / 10000);
        uint256 monthlyPayment = totalAmount / _durationMonths;
        
        Loan storage loan = loans[loanId];
        loan.id = loanId;
        loan.borrower = _borrower;
        loan.amount = _amount;
        loan.interestRate = _interestRate;
        loan.durationMonths = _durationMonths;
        loan.startTime = block.timestamp;
        loan.nextPaymentDue = block.timestamp + 30 days;
        loan.monthlyPayment = monthlyPayment;
        loan.isActive = true;
        loan.approvalProposalId = _proposalId;
        loan.ipfsAgreementCID = _agreementCID;
        
        loanIds.push(loanId);
        
        emit LoanApproved(loanId, _borrower, _amount);
    }
    
    function recordLoanRepayment(
        uint256 _loanId,
        uint256 _amount,
        string memory _ipfsReceiptCID
    ) external onlyMember {
        Loan storage loan = loans[_loanId];
        require(loan.isActive, "Loan not active");
        
        loan.totalRepaid += _amount;
        
        uint256 totalOwed = loan.amount + (loan.amount * loan.interestRate / 10000);
        
        if (loan.totalRepaid >= totalOwed) {
            loan.isActive = false;
        } else {
            // Update next payment due (simplified)
            loan.nextPaymentDue = block.timestamp + 30 days;
        }
        
        emit LoanRepayment(_loanId, _amount, totalOwed - loan.totalRepaid);
    }
    // MEMBER MANAGEMENT
    
    
    function _addMember(address _member, uint256 _votingPower) internal {
        require(!members[_member].isActive, "Already member");
        
        members[_member] = Member({
            wallet: _member,
            totalContributions: 0,
            votingPower: _votingPower,
            shares: 0,
            lastContributionTime: 0,
            isActive: true
        });
        
        memberList.push(_member);
        totalMembers++;
        
        emit MemberAdded(_member, _votingPower);
    }
    
    function _removeMember(address _member) internal {
        require(members[_member].isActive, "Not active");
        members[_member].isActive = false;
        totalMembers--;
        emit MemberRemoved(_member);
    }
    
    // VIEW FUNCTIONS
   
    
    function isMember(address _account) external view returns (bool) {
        return members[_account].isActive;
    }
    
    function getMemberVotingPower(address _account) external view returns (uint256) {
        return members[_account].votingPower;
    }
    
    function _getTotalVotingPower() internal view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < memberList.length; i++) {
            if (members[memberList[i]].isActive) {
                total += members[memberList[i]].votingPower;
            }
        }
        return total;
    }
    
    function getProposalVotes(uint256 _proposalId) external view returns (
        uint256 votesFor,
        uint256 votesAgainst,
        bool isActive,
        bool passed
    ) {
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.votesFor,
            proposal.votesAgainst,
            block.timestamp < proposal.endTime,
            proposal.passed
        );
    }
    
       
    function getMembersList() external view returns (address[] memory) {
        return memberList;
    }
    
    function getActiveProposals() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < proposalIds.length; i++) {
            if (block.timestamp < proposals[proposalIds[i]].endTime && !proposals[proposalIds[i]].executed) {
                activeCount++;
            }
        }
        
        uint256[] memory activeProposals = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < proposalIds.length; i++) {
            if (block.timestamp < proposals[proposalIds[i]].endTime && !proposals[proposalIds[i]].executed) {
                activeProposals[index] = proposalIds[i];
                index++;
            }
        }
        
        return activeProposals;
    }
}

