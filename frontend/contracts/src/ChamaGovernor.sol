// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorSettingsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

interface IChamaMembershipToken {
    function mintMembership(address to) external;
    function revokeMembership(address from) external;
}

contract ChamaGovernor is
    Initializable,
    GovernorUpgradeable,
    GovernorSettingsUpgradeable,
    GovernorCountingSimpleUpgradeable,
    GovernorVotesUpgradeable,
    GovernorVotesQuorumFractionUpgradeable
{
    enum ProposalType {
        ADD_MEMBER,
        REMOVE_MEMBER,
        CONTRIBUTION,
        LOAN_REQUEST,
        MEMBER_EXIT,
        CONSTITUTION_CREATE,
        CONSTITUTION_EDIT
    }

    struct ProposalMetadata {
        ProposalType pType;
        address target;
        uint96 amt;
        bool executed;
    }

    mapping(uint256 => ProposalMetadata) public proposalMetadata;
    mapping(uint256 => string) private _ipfsHashes;

    address public bank;
    bytes32 public constitutionHash;
    bool private _initialized;

    event MemberAdded(address indexed member);
    event MemberRemoved(address indexed member);
    event ConstitutionUpdated(bytes32 indexed hash);
    event LoanApproved(address indexed borrower, uint256 amount, uint256 indexed proposalId);
    event ContributionUpdated(uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    
    function initialize(IVotes token_, string memory name_, address bank_)
        external
        initializer
    {
        __ChamaGovernor_init(token_, name_, bank_);
    }

    function __ChamaGovernor_init(
        IVotes token_,
        string memory name_,
        address bank_
    ) internal onlyInitializing {
        __Governor_init(name_);
        __GovernorSettings_init(0, 300, 0);
        __GovernorVotes_init(token_);
        __GovernorVotesQuorumFraction_init(51);
        bank = bank_;
    }

        function initializeFounders(address[] memory) external {
        require(!_initialized, "Already initialized");
        require(msg.sender == address(token()), "Only token"); // <-- fixed
        _initialized = true;
    }

       function proposeWithMetadata(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        ProposalType pType,
        address target,
        uint256 amt,
        string memory ipfsHash
    ) public returns (uint256) {
        require(_initialized, "Not init");
        require(_hasVotingPower(msg.sender), "Not member");

        uint256 pid = propose(targets, values, calldatas, description);

        proposalMetadata[pid] = ProposalMetadata({
            pType: pType,
            target: target,
            amt: uint96(amt),
            executed: false
        });

        if (bytes(ipfsHash).length > 0) _ipfsHashes[pid] = ipfsHash;

        return pid;
    }
// 1. REMOVE your custom execute() function completely

// 2. Use these two overrides only:

// Skip external calls for "signaling-only" proposals, and emit events here
function _executeOperations(
    uint256 proposalId,
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
) internal override {
    ProposalMetadata storage meta = proposalMetadata[proposalId];

    // These proposal types are "signaling only" → no external calls needed, but emit events
    if (
        meta.pType == ProposalType.LOAN_REQUEST ||
        meta.pType == ProposalType.CONTRIBUTION ||
        meta.pType == ProposalType.CONSTITUTION_CREATE ||
        meta.pType == ProposalType.CONSTITUTION_EDIT
    ) {
        // Fire events for signaling proposals (no external actions)
        if (meta.pType == ProposalType.LOAN_REQUEST) {
            emit LoanApproved(meta.target, meta.amt, proposalId);
        } else if (meta.pType == ProposalType.CONTRIBUTION) {
            emit ContributionUpdated(meta.amt);
        } else if (
            meta.pType == ProposalType.CONSTITUTION_CREATE ||
            meta.pType == ProposalType.CONSTITUTION_EDIT
        ) {
            string memory ipfs = _ipfsHashes[proposalId];
            if (bytes(ipfs).length > 0) {
                constitutionHash = keccak256(bytes(ipfs));
                emit ConstitutionUpdated(constitutionHash);
            }
        }
        // Mark as executed in your metadata
        meta.executed = true;
        return; // Skip external calls
    }

    // For action-based proposals (ADD_MEMBER, REMOVE_MEMBER, MEMBER_EXIT): execute first, then emit
    super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);

    // Now emit events after successful execution
    if (meta.pType == ProposalType.ADD_MEMBER) {
        emit MemberAdded(meta.target);
    } else if (meta.pType == ProposalType.REMOVE_MEMBER || meta.pType == ProposalType.MEMBER_EXIT) {
        emit MemberRemoved(meta.target);
    }

    // Mark as executed in your metadata (syncs with base Governor state)
    meta.executed = true;
}


function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(GovernorUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
        function _hasVotingPower(address account) internal view returns (bool) {
        return ERC20Upgradeable(address(token())).balanceOf(account) > 0;
    }

    function getIpfsHash(uint256 pid) external view returns (string memory) {
        return _ipfsHashes[pid];
    }

    function isActiveMember(address account) external view returns (bool) {
        return _hasVotingPower(account);
    }

    function updateBank(address newBank) external onlyGovernance {
        bank = newBank;
    }

        function votingDelay()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(GovernorUpgradeable, GovernorVotesQuorumFractionUpgradeable)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function proposalThreshold()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.proposalThreshold();
    }
    function proposalExecuted(uint256 proposalId) external view returns (bool) {
    return proposalMetadata[proposalId].executed;
}
}
