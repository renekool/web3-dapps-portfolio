// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ETH Document Registry
/// @author ---
/**
 * @notice Contrato inteligente para almacenar y verificar la autenticidad de documentos
 *         mediante el registro de su hash, timestamp, firmante y firma digital.
 *
 * @dev
 * - No almacena archivos completos on-chain.
 * - Solo almacena el hash del documento.
 * - La verificacion criptografica se realiza off-chain.
 * - Previene almacenamiento de hashes duplicados.
 */
contract DocumentRegistry {
    // Struct to store document information
    struct Document {
        bytes32 hash;
        uint256 timestamp;
        address signer; // Used to check existence: signer != address(0)
        bytes signature;
        string fileName;
        string fileCategory;
    }

    // Mapping from document hash to Document struct
    mapping(bytes32 => Document) public documents;

    // Array to store all document hashes for enumeration
    bytes32[] public documentHashes;

    // Events
    event DocumentStored(
        bytes32 indexed hash,
        address indexed signer,
        uint256 timestamp,
        bytes signature,
        string fileName,
        string fileCategory
    );

    event DocumentVerified(
        bytes32 indexed hash,
        address indexed signer,
        bool isValid
    );

    // Modifiers
    modifier documentNotExists(bytes32 _hash) {
        _documentNotExists(_hash);
        _;
    }

    modifier documentExists(bytes32 _hash) {
        _documentExists(_hash);
        _;
    }

    function _documentNotExists(bytes32 _hash) internal view {
        require(
            documents[_hash].signer == address(0),
            "Documento ya registrado"
        );
    }

    function _documentExists(bytes32 _hash) internal view {
        require(
            documents[_hash].signer != address(0),
            "Documento no registrado"
        );
    }

    /**
     * @notice Almacena el hash de un documento con su firma y metadatos.
     * @dev Sigue el patron de verificacion previa (checks) y emision de eventos.
     *      Usa calldata para optimizar gas en parametros dinamicos.
     *      Validacion de direccion cero segun buenas practicas de seguridad.
     * @param _hash El hash keccak256 del documento.
     * @param _timestamp El timestamp de creacion del documento.
     * @param _signature La firma digital del hash del documento.
     * @param _signer La direccion de la cuenta que firmo el documento.
     * @param _fileName El nombre original del archivo.
     * @param _fileCategory La categoria o tipo de documento.
     */
    function storeDocumentHash(
        bytes32 _hash,
        uint256 _timestamp,
        bytes calldata _signature,
        address _signer,
        string calldata _fileName,
        string calldata _fileCategory
    ) external documentNotExists(_hash) {
        require(_signer != address(0), "Direccion de firmante invalida");
        require(_signature.length > 0, "Firma requerida");

        documents[_hash] = Document({
            hash: _hash,
            timestamp: _timestamp,
            signer: _signer,
            signature: _signature,
            fileName: _fileName,
            fileCategory: _fileCategory
        });

        documentHashes.push(_hash);

        emit DocumentStored(
            _hash,
            _signer,
            _timestamp,
            _signature,
            _fileName,
            _fileCategory
        );
    }

    /**
     * @notice Verifica la autenticidad de un documento comparando el firmante y la firma.
     * @dev No realiza ecrecover on-chain (la verificacion es off-chain).
     *      Emite el evento DocumentVerified para auditoria.
     * @param _hash El hash del documento a verificar.
     * @param _signer La direccion que reclama ser el firmante.
     * @param _signature La firma a comparar.
     * @return isValid True si el firmante y la firma coinciden con lo registrado.
     */
    function verifyDocument(
        bytes32 _hash,
        address _signer,
        bytes calldata _signature
    ) external returns (bool isValid) {
        // Ensure document is registered first to satisfy RF-09 requirements and tests
        _isStored(_hash);

        Document memory doc = documents[_hash];

        // Check if the signer matches and the signature provided matches the stored one
        // We use keccak256 to compare bytes efficiently
        isValid = (doc.signer == _signer &&
            _signature.length > 0 &&
            keccak256(doc.signature) == keccak256(_signature));

        emit DocumentVerified(_hash, _signer, isValid);
        return isValid;
    }

    /**
     * @notice Checks if a document exists.
     */
    function _isStored(bytes32 _hash) internal view {
        require(
            documents[_hash].signer != address(0),
            "Documento no registrado"
        );
    }

    /**
     * @dev Get complete document information
     */
    function getDocumentInfo(
        bytes32 _hash
    ) external view documentExists(_hash) returns (Document memory) {
        return documents[_hash];
    }

    /**
     * @dev Check if a document exists
     */
    function isDocumentStored(
        bytes32 _hash
    ) external view returns (bool exists) {
        return documents[_hash].signer != address(0);
    }

    /**
     * @dev Get total number of documents
     */
    function getDocumentCount() external view returns (uint256 count) {
        return documentHashes.length;
    }

    /**
     * @dev Get document hash by index
     */
    function getDocumentHashByIndex(
        uint256 _index
    ) external view returns (bytes32 hash) {
        require(_index < documentHashes.length, "Index out of bounds");
        return documentHashes[_index];
    }

    /**
     * @dev Get document signature
     */
    function getDocumentSignature(
        bytes32 _hash
    ) external view documentExists(_hash) returns (bytes memory signature) {
        return documents[_hash].signature;
    }
}
