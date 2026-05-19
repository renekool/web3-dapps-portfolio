// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EuroToken
 * @notice ERC20 stablecoin representing euros within the Web3 ecommerce ecosystem.
 *         1 EURT = 1 EUR = 1_000_000 units (6 decimals).
 * @dev Minting is restricted to the contract owner. Supply is capped at MAX_SUPPLY.
 *      Consumed by: Web Compra Crypto (mint), Web Pasarela de Pagos (approve),
 *      and Smart Contract Ecommerce (transferFrom).
 */
contract EuroToken is ERC20, ERC20Burnable, Ownable {
    // ─── Errors ──────────────────────────────────────────────────────────────

    error EuroToken__MaxSupplyExceeded();

    // ─── Events ──────────────────────────────────────────────────────────────

    event Minted(address indexed to, uint256 amount);

    // ─── Constants ───────────────────────────────────────────────────────────

    uint256 public immutable MAX_SUPPLY;

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor() ERC20("EuroToken", "EURT") Ownable(msg.sender) {
        MAX_SUPPLY = 100_000_000 * 10 ** 6;
    }

    // ─── Public functions ─────────────────────────────────────────────────────

    /**
     * @notice Mints `amount` EURT tokens to `to`.
     * @dev Only callable by owner. Reverts if mint would exceed MAX_SUPPLY.
     * @param to    Recipient address.
     * @param amount Amount in smallest units (1 EURT = 1_000_000).
     */
    function mint(address to, uint256 amount) external onlyOwner {
        if (totalSupply() + amount > MAX_SUPPLY) {
            revert EuroToken__MaxSupplyExceeded();
        }
        _mint(to, amount);
        emit Minted(to, amount);
    }

    // ─── Overrides ────────────────────────────────────────────────────────────

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
