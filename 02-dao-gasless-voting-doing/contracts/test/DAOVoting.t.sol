// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {DAOVoting} from "../src/DAOVoting.sol";

contract DAOVotingTest is Test {
    DAOVoting dao;

    address alice = address(0x1);
    address bob = address(0x2);
    address charlie = address(0x3);

    function setUp() public {
        dao = new DAOVoting(address(0x123)); // Dummy forwarder
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(charlie, 100 ether);
    }

    function test_Deposit() public {
        vm.prank(alice);
        dao.deposit{value: 10 ether}();

        assertEq(dao.deposits(alice), 10 ether);
        assertEq(dao.totalDeposited(), 10 ether);
    }

    function test_RevertIf_DepositZero() public {
        vm.prank(alice);
        vm.expectRevert("Deposit must be > 0");
        dao.deposit{value: 0}();
    }

    function test_CreateProposal_Success() public {
        vm.prank(alice);
        dao.deposit{value: 10 ether}();

        vm.prank(alice);
        uint256 id = dao.createProposal(bob, 1 ether, "ipfs://test");

        (address proposer, address recipient, uint256 amount, , , , , , , , ) = dao.proposals(id);
        assertEq(proposer, alice);
        assertEq(recipient, bob);
        assertEq(amount, 1 ether);
    }

    function test_RevertIf_CreateProposal_NotEnoughFunds() public {
        vm.prank(alice);
        dao.deposit{value: 1 ether}();
        vm.prank(bob);
        dao.deposit{value: 99 ether}();

        // bob has 99%, alice has 1%. 1% is allowed.
        vm.prank(charlie); // charlie has 0%
        vm.expectRevert("Proposer needs 1% of total deposits");
        dao.createProposal(bob, 1 ether, "ipfs://test");
    }

    function test_RevertIf_CreateProposal_AmountOver25Percent() public {
        vm.prank(alice);
        dao.deposit{value: 100 ether}();

        vm.prank(alice);
        vm.expectRevert("Max 25% of treasury limit");
        dao.createProposal(bob, 26 ether, "ipfs://test"); // More than 25%
    }

    function test_Vote_ChangeVote() public {
        vm.prank(alice);
        dao.deposit{value: 10 ether}();

        vm.prank(alice);
        uint256 id = dao.createProposal(bob, 2 ether, "ipfs://test");

        vm.startPrank(alice);
        dao.vote(id, DAOVoting.VoteType.For);
        
        (, , , , , , uint256 forVotes, uint256 againstVotes, , , ) = dao.proposals(id);
        assertEq(forVotes, 10 ether);
        assertEq(againstVotes, 0);

        // Change vote
        dao.vote(id, DAOVoting.VoteType.Against);
        vm.stopPrank();

        (, , , , , , forVotes, againstVotes, , , ) = dao.proposals(id);
        assertEq(forVotes, 0);
        assertEq(againstVotes, 10 ether);
    }

    function test_RevertIf_Vote_SameOption() public {
        vm.prank(alice);
        dao.deposit{value: 10 ether}();

        vm.prank(alice);
        uint256 id = dao.createProposal(bob, 2 ether, "ipfs://test");

        vm.startPrank(alice);
        dao.vote(id, DAOVoting.VoteType.For);
        vm.expectRevert("Already voted that option");
        dao.vote(id, DAOVoting.VoteType.For); // Should fail
        vm.stopPrank();
    }

    function test_ExecuteProposal_Success() public {
        // Setup deposits
        vm.prank(alice);
        dao.deposit{value: 40 ether}();
        vm.prank(bob);
        dao.deposit{value: 60 ether}();

        vm.prank(alice);
        uint256 id = dao.createProposal(charlie, 10 ether, "ipfs://test");

        // Vote
        vm.prank(alice);
        dao.vote(id, DAOVoting.VoteType.For); // 40 votes for
        vm.prank(bob);
        dao.vote(id, DAOVoting.VoteType.Against); // 60 votes against wait.. majority won't be > 60%
        
        // Let's vote only For to pass majority and quorum
        // Quorum: 30% of 100 = 30
        // Bob changes his mind
        vm.prank(bob);
        dao.vote(id, DAOVoting.VoteType.For);

        uint256 deadline = block.timestamp + 1 days + 1 days + 1; // pass timelock

        vm.warp(deadline);
        dao.executeProposal(id);

        (, , , , , , , , , DAOVoting.ProposalState state, ) = dao.proposals(id);
        assert(state == DAOVoting.ProposalState.Executed);
        assertEq(charlie.balance, 100 ether + 10 ether);
        assertEq(dao.totalDeposited(), 90 ether);
    }

    function test_ExecuteProposal_Failed() public {
        vm.prank(alice);
        dao.deposit{value: 100 ether}();

        vm.prank(alice);
        uint256 id = dao.createProposal(charlie, 10 ether, "ipfs://test");

        vm.prank(alice);
        dao.vote(id, DAOVoting.VoteType.Against); // 100 votes against

        uint256 deadline = block.timestamp + 1 days + 1 days + 1;
        vm.warp(deadline);

        dao.executeProposal(id);
        (, , , , , , , , , DAOVoting.ProposalState state, ) = dao.proposals(id);
        assert(state == DAOVoting.ProposalState.Failed);
    }
}
