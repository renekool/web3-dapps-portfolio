// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

library PaymentLib {

    struct Payment {
        address paidBy;
        uint256 amount;
        bytes32 txHash;
        uint256 paidAt;
    }

    function execute(
        mapping(uint256 => Payment) storage payments,
        address euroToken,
        uint256 invoiceId,
        address customerAddress,
        address companyAddress,
        uint256 amount
    ) internal returns (bytes32 txHash) {
        require(amount > 0, "Amount must be > 0");

        bool success = IERC20(euroToken).transferFrom(customerAddress, companyAddress, amount);
        require(success, "Transfer failed");

        txHash = keccak256(abi.encodePacked(invoiceId, customerAddress, amount, block.timestamp));

        payments[invoiceId] = Payment({
            paidBy: customerAddress,
            amount: amount,
            txHash: txHash,
            paidAt: block.timestamp
        });
    }

    function getPayment(
        mapping(uint256 => Payment) storage payments,
        uint256 invoiceId
    ) internal view returns (Payment memory) {
        return payments[invoiceId];
    }
}
