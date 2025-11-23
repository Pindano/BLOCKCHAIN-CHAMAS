// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

interface IChamaGovernor {
    function initializeFounders(address[] memory founders) external;
}

contract ChamaMembershipToken is
    Initializable,
    ERC20Upgradeable,
    ERC20VotesUpgradeable,
    ERC20PermitUpgradeable,
    OwnableUpgradeable
{
    uint256 public constant VOTES_PER_MEMBER = 1;

    mapping(address => bool) public hasMembership;
    address public governor;
    bool private _initialized;

    event MembershipGranted(address indexed member);
    event MembershipRevoked(address indexed member);
    event GovernorSet(address indexed governor);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

        function initialize(string memory name, string memory symbol) external initializer {
        __ChamaMembershipToken_init(name, symbol);
    }

    function __ChamaMembershipToken_init(string memory name, string memory symbol)
        internal
        onlyInitializing
    {
        __ERC20_init(name, symbol);
        __ERC20Permit_init(name);
        __Ownable_init(msg.sender);               
    }

        function initializeGovernor(address _governor, address[] memory founders)
        external
        onlyOwner
    {
        require(!_initialized, "Already initialized");
        require(_governor != address(0), "Invalid governor");
        require(founders.length > 0, "No founders");

        governor = _governor;
        _initialized = true;

        for (uint i = 0; i < founders.length; i++) {
            _mintMembership(founders[i]);
        }

        _transferOwnership(_governor);
        IChamaGovernor(_governor).initializeFounders(founders);

        emit GovernorSet(_governor);
    }

        function mintMembership(address to) external onlyOwner {
        _mintMembership(to);
    }

    function _mintMembership(address to) internal {
        require(!hasMembership[to], "Already member");
        require(to != address(0), "Zero address");

        hasMembership[to] = true;
        _mint(to, VOTES_PER_MEMBER);
        _delegate(to, to);
        emit MembershipGranted(to);
    }

    function revokeMembership(address from) external onlyOwner {
        require(hasMembership[from], "Not member");
        hasMembership[from] = false;
        _burn(from, VOTES_PER_MEMBER);
        emit MembershipRevoked(from);
    }

       function _update(address from, address to, uint256 value)
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        if (from != address(0) && to != address(0)) {
            revert("Non-transferable");
        }
        super._update(from, to, value);
    }

       function delegate(address delegatee) public override {
        require(hasMembership[msg.sender], "Not member");
        require(hasMembership[delegatee] || delegatee == address(0), "Invalid delegate");
        super.delegate(delegatee);
    }

        function getMemberCount() external view returns (uint256) {
        return totalSupply() / VOTES_PER_MEMBER;
    }

    function isInitialized() external view returns (bool) {
        return _initialized;
    }

    function nonces(address owner)
        public
        view
        override(ERC20PermitUpgradeable, NoncesUpgradeable)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
