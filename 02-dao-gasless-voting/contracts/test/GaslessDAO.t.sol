// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {DAOVoting} from "../src/DAOVoting.sol";
import {MockForwarder} from "./MockForwarder.sol";

contract GaslessDAOTest is Test {
    DAOVoting dao;
    MockForwarder forwarder;

    uint256 voterPrivKey = 0xA11CE;
    address voter;
    address relayer = address(0x456);

    function setUp() public {
        voter = vm.addr(voterPrivKey);
        forwarder = new MockForwarder("DAOForwarder");
        dao = new DAOVoting(address(forwarder));
        
        vm.deal(voter, 100 ether);
        vm.deal(relayer, 1 ether);
        
        // Voter deposits natively first
        vm.prank(voter);
        dao.deposit{value: 10 ether}();
    }

    function test_GaslessVoting_Success() public {
        // 1. Create a proposal
        vm.prank(voter);
        uint256 proposalId = dao.createProposal(address(0xDEAD), 1 ether, "ipfs://test");

        // 2. Prepare Meta-Transaction data for 'vote'
        bytes memory callData = abi.encodeWithSelector(
            dao.vote.selector,
            proposalId,
            DAOVoting.VoteType.For
        );

        // 3. Create ForwardRequest using the test-exposed type
        MockForwarder.ForwardRequestDataTest memory request = MockForwarder.ForwardRequestDataTest({
            from: voter,
            to: address(dao),
            value: 0,
            gas: 100000,
            deadline: uint48(block.timestamp + 1 hours),
            data: callData,
            signature: ""
        });

        // 4. Sign the request (EIP-712)
        bytes32 domainSeparator = forwarder.getDomainSeparator();
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,uint48 deadline,bytes data)"),
                request.from,
                request.to,
                request.value,
                request.gas,
                forwarder.nonces(voter),
                request.deadline,
                keccak256(request.data)
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(voterPrivKey, digest);
        request.signature = abi.encodePacked(r, s, v);

        // 5. Relayer executes the meta-transaction
        // We need to cast our test struct to the actual contract struct
        // Since they share the same memory layout, we use assembly
        vm.prank(relayer);
        forwarder.execute(
            _castToForwardRequestData(request)
        );

        // 6. Assertions
        (, , , , , , uint256 forVotes, , , , ) = dao.proposals(proposalId);
        assertEq(forVotes, 10 ether, "Vote weight should be correctly attributed to voter");
        
        DAOVoting.VoteType voteType;
        uint256 weightVoted;
        bool hasVoted;
        (voteType, weightVoted, hasVoted) = dao.receipts(proposalId, voter);
        assertTrue(hasVoted, "Voter should have voted");
        assertEq(uint(voteType), uint(DAOVoting.VoteType.For), "Vote type should be For");
    }

    function _castToForwardRequestData(MockForwarder.ForwardRequestDataTest memory testReq) internal pure returns (MockForwarder.ForwardRequestData memory req) {
        assembly {
            req := testReq
        }
    }

    function test_RevertIf_GaslessVoting_InvalidSignature() public {
        vm.prank(voter);
        uint256 proposalId = dao.createProposal(address(0xDEAD), 1 ether, "ipfs://test");

        bytes memory callData = abi.encodeWithSelector(dao.vote.selector, proposalId, DAOVoting.VoteType.For);
        
        MockForwarder.ForwardRequestDataTest memory request = MockForwarder.ForwardRequestDataTest({
            from: voter,
            to: address(dao),
            value: 0,
            gas: 100000,
            deadline: uint48(block.timestamp + 1 hours),
            data: callData,
            signature: hex"abcd"
        });

        vm.prank(relayer);
        vm.expectRevert(); 
        forwarder.execute(_castToForwardRequestData(request));
    }
}
