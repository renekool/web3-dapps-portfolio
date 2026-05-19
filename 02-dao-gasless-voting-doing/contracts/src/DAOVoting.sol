// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {
    ReentrancyGuard
} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {
    ERC2771Context
} from "openzeppelin-contracts/contracts/metatx/ERC2771Context.sol";

contract DAOVoting is ReentrancyGuard, ERC2771Context {
    enum ProposalState {
        Pending,
        Active,
        Executed,
        Failed
    }
    enum VoteType {
        Abstain,
        For,
        Against
    }

    struct VoteReceipt {
        VoteType vote;
        uint256 weightVoted;
        bool hasVoted;
    }

    struct Proposal {
        address proposer;
        address recipient;
        uint256 amount;
        uint256 totalDepositedAtCreation;
        uint256 deadline;
        uint256 timelockDeadline;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        ProposalState state;
        string descriptionURI;
    }

    mapping(address => uint256) public deposits;
    uint256 public totalDeposited;

    Proposal[] public proposals;

    mapping(uint256 => mapping(address => VoteReceipt)) public receipts;

    event Deposited(address indexed user, uint256 amount);
    event ProposalCreated(
        uint256 indexed proposalId,
        address proposer,
        address recipient,
        uint256 amount,
        string descriptionURI
    );
    event Voted(
        uint256 indexed proposalId,
        address indexed voter,
        VoteType voteOption,
        uint256 weight
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalFailed(uint256 indexed proposalId, string reason);
    event TrustedForwarderUpdated(address forwarder);

    uint256 public constant MIN_VOTING_DURATION = 1 days;
    uint256 public constant TIMELOCK_DURATION = 1 days;

    constructor(address forwarder) ERC2771Context(forwarder) {
        emit TrustedForwarderUpdated(forwarder);
    }

    function _msgSender()
        internal
        view
        virtual
        override
        returns (address sender)
    {
        return ERC2771Context._msgSender();
    }

    function _msgData()
        internal
        view
        virtual
        override
        returns (bytes calldata)
    {
        return ERC2771Context._msgData();
    }

    function deposit() public payable {
        if (totalDeposited == 0) {
            require(msg.value >= 0.05 ether, "Bootstrap amount is too low");
        } else {
            require(
                msg.value >= totalDeposited / 100,
                "Deposit amount is below 1% threshold"
            );
        }
        deposits[_msgSender()] += msg.value;
        totalDeposited += msg.value;
        emit Deposited(_msgSender(), msg.value);
    }

    function createProposal(
        address target,
        uint256 reqAmount,
        string memory descriptionURI
    ) public returns (uint256) {
        require(totalDeposited > 0, "No funds in DAO");
        require(
            deposits[_msgSender()] >= totalDeposited / 100,
            "Proposer needs 1% of total deposits"
        );
        require(reqAmount > 0, "Amount must be > 0");
        require(
            reqAmount <= (totalDeposited * 25) / 100,
            "Max 25% of treasury limit"
        );

        uint256 deadline = block.timestamp + MIN_VOTING_DURATION;
        uint256 timelockDeadline = deadline + TIMELOCK_DURATION;

        proposals.push(
            Proposal({
                proposer: _msgSender(),
                recipient: target,
                amount: reqAmount,
                totalDepositedAtCreation: totalDeposited,
                deadline: deadline,
                timelockDeadline: timelockDeadline,
                forVotes: 0,
                againstVotes: 0,
                abstainVotes: 0,
                state: ProposalState.Active,
                descriptionURI: descriptionURI
            })
        );

        uint256 proposalId = proposals.length - 1;
        emit ProposalCreated(
            proposalId,
            _msgSender(),
            target,
            reqAmount,
            descriptionURI
        );
        return proposalId;
    }

    function vote(uint256 proposalId, VoteType voteOption) public {
        require(proposalId < proposals.length, "Invalid proposal");
        Proposal storage p = proposals[proposalId];
        require(p.state == ProposalState.Active, "Proposal not Active");
        require(block.timestamp <= p.deadline, "Voting deadline passed");

        uint256 weight = deposits[_msgSender()];
        require(weight > 0, "No voting weight");

        VoteReceipt storage receipt = receipts[proposalId][_msgSender()];

        if (receipt.hasVoted) {
            require(receipt.vote != voteOption, "Already voted that option");

            // Remove old vote weight
            if (receipt.vote == VoteType.For) {
                p.forVotes -= receipt.weightVoted;
            } else if (receipt.vote == VoteType.Against) {
                p.againstVotes -= receipt.weightVoted;
            } else if (receipt.vote == VoteType.Abstain) {
                p.abstainVotes -= receipt.weightVoted;
            }
        }

        receipt.hasVoted = true;
        receipt.vote = voteOption;
        receipt.weightVoted = weight;

        // Add new vote weight
        if (voteOption == VoteType.For) {
            p.forVotes += weight;
        } else if (voteOption == VoteType.Against) {
            p.againstVotes += weight;
        } else if (voteOption == VoteType.Abstain) {
            p.abstainVotes += weight;
        }

        emit Voted(proposalId, _msgSender(), voteOption, weight);
    }

    function executeProposal(uint256 proposalId) public nonReentrant {
        require(proposalId < proposals.length, "Invalid proposal");
        Proposal storage p = proposals[proposalId];

        require(p.state == ProposalState.Active, "Proposal not Active");
        require(block.timestamp > p.timelockDeadline, "Timelock not passed");

        uint256 totalDecisionVotes = p.forVotes + p.againstVotes;

        bool quorumMet = totalDecisionVotes >=
            (p.totalDepositedAtCreation * 30) / 100;

        bool majorityMet = false;
        if (totalDecisionVotes > 0) {
            majorityMet = p.forVotes > (totalDecisionVotes * 60) / 100;
        }

        if (!quorumMet || !majorityMet) {
            p.state = ProposalState.Failed;
            emit ProposalFailed(proposalId, "Quorum or Majority not met");
            return;
        }

        p.state = ProposalState.Executed;
        totalDeposited -= p.amount;

        (bool success, ) = p.recipient.call{value: p.amount}("");
        require(success, "Transfer failed");
        
        emit ProposalExecuted(proposalId);
    }

    function getProposalsCount() public view returns (uint256) {
        return proposals.length;
    }
}
