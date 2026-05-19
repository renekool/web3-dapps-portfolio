// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Escrow is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    constructor(address initialOwner) Ownable(initialOwner) {}

    // ─── State Machine ─────────────────────────────────────────────────────────

    enum State { Active, Completed, Cancelled }

    // ─── Operation struct ──────────────────────────────────────────────────────

    struct Operation {
        uint256 id;
        address creator;
        address tokenA;
        address tokenB;
        uint256 amountA;
        uint256 amountB;
        State state;
        address executor;
        uint256 createdAt;
        uint256 closedAt;
        uint256 deadline;
    }

    // ─── Events ────────────────────────────────────────────────────────────────

    event TokenAdded(address indexed token);
    event OperationCreated(uint256 indexed id, address indexed creator, address tokenA, address tokenB, uint256 amountA, uint256 amountB);
    event OperationCompleted(uint256 indexed id, address indexed executor);
    event OperationCancelled(uint256 indexed id);

    // ─── Storage ───────────────────────────────────────────────────────────────

    mapping(address => bool) public allowedTokens;
    address[] private tokenList;

    Operation[] public operations;
    uint256 private nextId;

    // ─── Token Management ──────────────────────────────────────────────────────

    function addToken(address token) external onlyOwner {
        require(token != address(0), "Zero address");
        require(!allowedTokens[token], "Already allowed");
        allowedTokens[token] = true;
        tokenList.push(token);
        emit TokenAdded(token);
    }

    function getAllowedTokens() external view returns (address[] memory) {
        return tokenList;
    }

    // ─── Operation Lifecycle ───────────────────────────────────────────────────

    function createOperation(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 deadline
    ) external nonReentrant whenNotPaused {
        require(tokenA != tokenB, "Tokens must differ");
        require(amountA > 0 && amountB > 0, "Amounts > 0");
        require(allowedTokens[tokenA] && allowedTokens[tokenB], "Token not allowed");
        require(deadline > block.timestamp, "Deadline in past");

        uint256 balBefore = IERC20(tokenA).balanceOf(address(this));
        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountA);
        require(IERC20(tokenA).balanceOf(address(this)) - balBefore == amountA, "Fee-on-transfer not allowed");

        uint256 id = nextId++;
        operations.push(Operation({
            id: id,
            creator: msg.sender,
            tokenA: tokenA,
            tokenB: tokenB,
            amountA: amountA,
            amountB: amountB,
            state: State.Active,
            executor: address(0),
            createdAt: block.timestamp,
            closedAt: 0,
            deadline: deadline
        }));

        emit OperationCreated(id, msg.sender, tokenA, tokenB, amountA, amountB);
    }

    function completeOperation(uint256 id) external nonReentrant whenNotPaused {
        require(id < operations.length, "Invalid id");
        Operation storage op = operations[id];
        require(op.state == State.Active, "Not active");
        require(msg.sender != op.creator, "Is creator");
        require(block.timestamp <= op.deadline, "Operation expired");

        // checks-effects-interactions
        op.state = State.Completed;
        op.executor = msg.sender;
        op.closedAt = block.timestamp;

        uint256 creatorBalBefore = IERC20(op.tokenB).balanceOf(op.creator);
        IERC20(op.tokenB).safeTransferFrom(msg.sender, op.creator, op.amountB);
        require(IERC20(op.tokenB).balanceOf(op.creator) - creatorBalBefore == op.amountB, "Fee-on-transfer not allowed");
        IERC20(op.tokenA).safeTransfer(msg.sender, op.amountA);

        emit OperationCompleted(id, msg.sender);
    }

    function cancelOperation(uint256 id) external nonReentrant {
        require(id < operations.length, "Invalid id");
        Operation storage op = operations[id];
        require(op.state == State.Active, "Not active");
        require(msg.sender == op.creator, "Not creator");

        // checks-effects-interactions
        op.state = State.Cancelled;
        op.closedAt = block.timestamp;

        IERC20(op.tokenA).safeTransfer(op.creator, op.amountA);

        emit OperationCancelled(id);
    }

    // ─── Getters ───────────────────────────────────────────────────────────────

    function getAllOperations() external view returns (Operation[] memory) {
        return operations;
    }

    // ─── Admin ─────────────────────────────────────────────────────────────────

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
