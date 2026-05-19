// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {CompanyLib} from "./libraries/CompanyLib.sol";
import {CustomerLib} from "./libraries/CustomerLib.sol";
import {ProductLib} from "./libraries/ProductLib.sol";
import {CartLib} from "./libraries/CartLib.sol";
import {InvoiceLib} from "./libraries/InvoiceLib.sol";
import {PaymentLib} from "./libraries/PaymentLib.sol";

contract Ecommerce {

    // ══════════════════════════════════════════════════════════════════════════
    // STATE
    // ══════════════════════════════════════════════════════════════════════════

    address public owner;
    address public euroTokenAddress;

    // ─── Company ──────────────────────────────────────────────────────────────
    uint256 public companyCount;
    mapping(uint256 => CompanyLib.Company) private companies;
    mapping(address => uint256) private companyIdByAddress;

    // ─── Customer ─────────────────────────────────────────────────────────────
    mapping(address => CustomerLib.Customer) private customers;

    // ─── Product ──────────────────────────────────────────────────────────────
    uint256 public productCount;
    mapping(uint256 => ProductLib.Product) private products;
    mapping(uint256 => uint256[]) private companyProductIds;

    // ─── Cart ─────────────────────────────────────────────────────────────────
    mapping(address => CartLib.CartItem[]) private carts;

    // ─── Invoice ──────────────────────────────────────────────────────────────
    uint256 public invoiceCount;
    mapping(uint256 => InvoiceLib.Invoice) private invoices;
    mapping(address => uint256[]) private invoicesByCustomer;
    mapping(uint256 => uint256[]) private invoicesByCompany;

    // ─── Payment ──────────────────────────────────────────────────────────────
    mapping(uint256 => PaymentLib.Payment) private payments;

    // ══════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ══════════════════════════════════════════════════════════════════════════

    event CompanyRegistered(uint256 indexed companyId, address indexed companyAddress, string name);
    event CompanyUpdated(uint256 indexed companyId, string name);
    event CompanyActivated(uint256 indexed companyId);
    event CompanyDeactivated(uint256 indexed companyId);
    event CustomerRegistered(address indexed customerAddress);
    event ProductAdded(uint256 indexed productId, uint256 indexed companyId, string name, uint256 price, uint256 stock);
    event ProductUpdated(uint256 indexed productId, string name, uint256 price, uint256 stock);
    event ProductActivated(uint256 indexed productId);
    event ProductDeactivated(uint256 indexed productId);
    event CartUpdated(address indexed customerAddress, uint256 indexed productId, uint256 quantity);
    event CartCleared(address indexed customerAddress);
    event InvoiceCreated(uint256 indexed invoiceId, address indexed customerAddress, uint256 indexed companyId, uint256 totalAmount);
    event PaymentProcessed(uint256 indexed invoiceId, address indexed customerAddress, uint256 amount, bytes32 txHash);

    // ══════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ══════════════════════════════════════════════════════════════════════════

    constructor(address _euroToken) {
        require(_euroToken != address(0), "Invalid EuroToken address");
        owner = msg.sender;
        euroTokenAddress = _euroToken;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MODIFIERS
    // ══════════════════════════════════════════════════════════════════════════

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // COMPANY
    // ══════════════════════════════════════════════════════════════════════════

    function registerCompany(string calldata name, string calldata description) external {
        companyCount++;
        CompanyLib.register(companies, companyIdByAddress, companyCount, msg.sender, name, description);
        emit CompanyRegistered(companyCount, msg.sender, name);
    }

    function registerCompanyByAdmin(address companyAddress, string calldata name, string calldata description) external onlyOwner {
        companyCount++;
        CompanyLib.register(companies, companyIdByAddress, companyCount, companyAddress, name, description);
        emit CompanyRegistered(companyCount, companyAddress, name);
    }

    function getCompanyById(uint256 id) external view returns (CompanyLib.Company memory) {
        return CompanyLib.getById(companies, id, companyCount);
    }

    function getCompanyByAddress(address addr) external view returns (CompanyLib.Company memory) {
        return CompanyLib.getByAddress(companies, companyIdByAddress, addr);
    }

    function updateCompany(uint256 id, address companyAddress, string calldata name, string calldata description) external onlyOwner {
        address oldAddress = companies[id].companyAddress;
        
        if (oldAddress != companyAddress) {
            require(companyIdByAddress[companyAddress] == 0, "Address already registered");
            delete companyIdByAddress[oldAddress];
            companyIdByAddress[companyAddress] = id;
        }

        CompanyLib.update(companies, id, companyAddress, name, description, companyCount);
        emit CompanyUpdated(id, name);
    }

    function toggleCompanyStatus(uint256 id) external onlyOwner {
        CompanyLib.Company storage company = companies[id];
        require(id > 0 && id <= companyCount, "Company not found");
        company.isActive = !company.isActive;
        if (company.isActive) emit CompanyActivated(id);
        else emit CompanyDeactivated(id);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CUSTOMER
    // ══════════════════════════════════════════════════════════════════════════

    function getCustomer(address addr) external view returns (CustomerLib.Customer memory) {
        return CustomerLib.getCustomer(customers, addr);
    }

    function isCustomerRegistered(address addr) external view returns (bool) {
        return CustomerLib.isRegistered(customers, addr);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PRODUCT
    // ══════════════════════════════════════════════════════════════════════════

    function addProduct(string calldata name, string calldata description, uint256 price, uint256 stock) external {
        uint256 companyId = companyIdByAddress[msg.sender];
        require(companyId != 0, "Not a registered company");
        require(companies[companyId].isActive, "Company not active");

        productCount++;
        ProductLib.add(products, companyProductIds, productCount, companyId, name, description, price, stock);
        emit ProductAdded(productCount, companyId, name, price, stock);
    }

    function updateProduct(uint256 productId, string calldata name, string calldata description, uint256 price, uint256 stock) external {
        uint256 companyId = companyIdByAddress[msg.sender];
        require(companyId != 0, "Not a registered company");
        require(products[productId].companyId == companyId, "Not your product");

        ProductLib.update(products, productId, name, description, price, stock);
        emit ProductUpdated(productId, name, price, stock);
    }

    function getProduct(uint256 productId) external view returns (ProductLib.Product memory) {
        return ProductLib.getProduct(products, productId, productCount);
    }

    function getProductsByCompany(uint256 companyId) external view returns (uint256[] memory) {
        return ProductLib.getByCompany(companyProductIds, companyId);
    }

    function toggleProductStatus(uint256 productId) external {
        uint256 companyId = companyIdByAddress[msg.sender];
        require(companyId != 0, "Not a registered company");
        require(products[productId].companyId == companyId, "Not your product");

        products[productId].isActive = !products[productId].isActive;
        if (products[productId].isActive) emit ProductActivated(productId);
        else emit ProductDeactivated(productId);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CART
    // ══════════════════════════════════════════════════════════════════════════

    function addToCart(uint256 productId, uint256 quantity) external {
        bool wasCreated = CustomerLib.ensureExists(customers, msg.sender);
        if (wasCreated) emit CustomerRegistered(msg.sender);

        CartLib.addItem(carts, products, productCount, msg.sender, productId, quantity);
        emit CartUpdated(msg.sender, productId, quantity);
    }

    function getCart(address addr) external view returns (CartLib.CartItem[] memory) {
        return CartLib.getCart(carts, addr);
    }

    function getCartTotal(address addr) external view returns (uint256) {
        return CartLib.getCartTotal(carts, products, addr);
    }

    function clearCart() external {
        CartLib.clearCart(carts, msg.sender);
        emit CartCleared(msg.sender);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // INVOICE
    // ══════════════════════════════════════════════════════════════════════════

    function createInvoice(uint256 companyId) external returns (uint256) {
        CompanyLib.Company memory company = CompanyLib.getById(companies, companyId, companyCount);
        require(company.isActive, "Company not active");

        CartLib.CartItem[] memory cartItems = CartLib.getCart(carts, msg.sender);
        require(cartItems.length > 0, "Cart is empty");

        for (uint256 i = 0; i < cartItems.length; i++) {
            require(products[cartItems[i].productId].companyId == companyId, "Product company mismatch");
        }

        invoiceCount++;
        uint256 totalAmount = InvoiceLib.create(
            invoices,
            invoicesByCustomer,
            invoicesByCompany,
            products,
            invoiceCount,
            msg.sender,
            companyId,
            cartItems
        );

        CartLib.clearCart(carts, msg.sender);
        emit CartCleared(msg.sender);

        emit InvoiceCreated(invoiceCount, msg.sender, companyId, totalAmount);
        return invoiceCount;
    }

    function getInvoice(uint256 invoiceId) external view returns (InvoiceLib.Invoice memory) {
        return InvoiceLib.getInvoice(invoices, invoiceId, invoiceCount);
    }

    function getInvoicesByCustomer(address addr) external view returns (uint256[] memory) {
        return InvoiceLib.getByCustomer(invoicesByCustomer, addr);
    }

    function getInvoicesByCompany(uint256 companyId) external view returns (uint256[] memory) {
        return InvoiceLib.getByCompany(invoicesByCompany, companyId);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PAYMENT
    // ══════════════════════════════════════════════════════════════════════════

    function processPayment(uint256 invoiceId) external {
        InvoiceLib.Invoice storage inv = InvoiceLib.getInvoice(invoices, invoiceId, invoiceCount);
        require(inv.customerAddress == msg.sender, "Not your invoice");
        require(!inv.isPaid, "Already paid");

        CompanyLib.Company memory company = CompanyLib.getById(companies, inv.companyId, companyCount);
        require(company.isActive, "Company not active");
        require(company.companyAddress != msg.sender, "Cannot pay your own company");

        // Checks-Effects-Interactions: mark paid before transfer
        inv.isPaid = true;

        bytes32 txHash = PaymentLib.execute(
            payments,
            euroTokenAddress,
            invoiceId,
            msg.sender,
            company.companyAddress,
            inv.totalAmount
        );

        emit PaymentProcessed(invoiceId, msg.sender, inv.totalAmount, txHash);
    }

    function getPayment(uint256 invoiceId) external view returns (PaymentLib.Payment memory) {
        PaymentLib.Payment memory p = PaymentLib.getPayment(payments, invoiceId);
        require(p.paidAt > 0, "Payment not found");
        return p;
    }
}
