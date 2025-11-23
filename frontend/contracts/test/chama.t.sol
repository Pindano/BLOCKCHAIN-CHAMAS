// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ChamaFactory.sol";
import "../src/ChamaGovernor.sol";
import "../src/ChamaMembershipToken.sol";
import "@openzeppelin/contracts/governance/IGovernor.sol";  // ← ADD THIS IMPORT

contract ChamaTest is Test {
    ChamaFactory factory;
    ChamaGovernor governor;
    ChamaMembershipToken token;

    address alice = address(0xa1);
    address bob   = address(0xb2);
    address carol = address(0xc3);
    address bank  = address(0xb4);

    function setUp() public {
        factory = new ChamaFactory();

        string memory name = "Test Chama";
        string memory symbol = "TCH";
        address[] memory founders = new address[](2);
        founders[0] = alice;
        founders[1] = bob;

        vm.prank(alice);
        (address gov, address tok) = factory.createChama(name, symbol, founders, bank);

        governor = ChamaGovernor(payable(gov));
        token = ChamaMembershipToken(tok);

        // Fund for gas
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    function test_VotingFlow_AddMember() public {
        // === 1. Propose ADD_MEMBER for Carol ===
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        targets[0] = address(token);
        values[0] = 0;
        calldatas[0] = abi.encodeCall(ChamaMembershipToken.mintMembership, (carol));

        string memory description = "Add Carol as member";
        ChamaGovernor.ProposalType pType = ChamaGovernor.ProposalType.ADD_MEMBER;  // ← Define pType

        vm.prank(alice);
        uint256 proposalId = governor.proposeWithMetadata(
            targets,
            values,
            calldatas,
            description,
            pType,
            carol,
            0,
            ""
        );

        // === 2. Wait for voting delay ===
        uint256 votingDelay = governor.votingDelay();
        vm.roll(block.number + votingDelay + 1);  // Enter Active state

        // === 3. Both vote FOR (51% quorum needs 2/2) ===
        vm.prank(alice);
        governor.castVote(proposalId, 1); // For

        vm.prank(bob);
        governor.castVote(proposalId, 1); // For

        // === 4. Fast-forward past voting period ===
        uint256 votingPeriod = governor.votingPeriod();
        vm.roll(block.number + votingPeriod);

        // === 5. Verify state is Succeeded ===
        assertEq(
            uint256(governor.state(proposalId)),
            uint256(IGovernor.ProposalState.Succeeded)  // ← FIXED: Use IGovernor
        );

        // === 6. Execute ===
        bytes32 descriptionHash = keccak256(bytes(description));

        vm.expectEmit(true, true, false, true);
        emit ChamaGovernor.MemberAdded(carol);

        vm.prank(alice);
        governor.execute(targets, values, calldatas, descriptionHash);

        // === 7. Final checks ===
        assertEq(
            uint256(governor.state(proposalId)),
            uint256(IGovernor.ProposalState.Executed)  // ← FIXED: Use IGovernor
        );
        assertEq(token.balanceOf(carol), 1);
        assertEq(token.getMemberCount(), 3);  // Assuming your token has this function
        assertTrue(governor.proposalExecuted(proposalId));
    }
}
