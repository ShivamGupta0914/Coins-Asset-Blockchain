// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import "./IERC721.sol";
import "./IERC20.sol";

contract Assets is IERC721 {
    IERC20 private coins;
    uint256 public totalNFTs;
    mapping(uint256 => uint256) public prices;
    mapping(uint256 => address) private owner;
    mapping(uint256 => address) private approved;
    mapping(address => uint256) private balance;
    mapping(address => mapping(address => bool)) private approvalForAll;

    /**
    * @dev initializes the value of Coin contract address.
    * @param _coinsAddress is the address of Coins contract.
    */
    constructor(address _coinsAddress) {
        coins = IERC20(_coinsAddress);
    }

    /**
    * @dev this modifier checks that the address which will be approved is not the zero address.
    * @param _operator is the address which will be approved.
    */
    modifier approvalCheck(address _operator) {
        require(_operator != address(0), "can not approve zero address");
        _;
    }

    /**
    * @dev this modifier checks that owner owns a token or not.
    * @param _owner is the address which is claimed to be the address of token owner.
    * @param _tokenId is the id token.
    */
    modifier tokenOwnerCheck(address _owner, uint256 _tokenId) {
        require(_owner == owner[_tokenId], "owner does not own this token");
        _;
    }

    /**
    * @dev this function calls an internal function _safeTransferFrom.
    */
    function transferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external {
        _transferFrom(_from, _to, _tokenId);
    }

    /**
    * @dev this function calls an internal function _safeTransferFrom. 
    */
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes memory _data
    ) external {
        _safeTransferFrom(_from, _to, _tokenId, _data);
    }

    /**
    * @dev this function calls an internal function _safeTransferFrom. 
    */
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external {
        _safeTransferFrom(_from, _to, _tokenId, "");
    }

    /**
    * @dev this function mints a new token everytime, anyone can call this method,
      emits a Transfer event.
    */
    function mintNFT() external {
        owner[totalNFTs] = msg.sender;
        balance[msg.sender]++;
        totalNFTs++;
        emit Transfer(address(0), msg.sender, totalNFTs-1);
    }

    /**
    * @dev this function sets the price of a particular token, only owner of token can set this price,
    * if he wants to sell th token.
    * @param _tokenId is the id of the token.
    * @param _tokensEquivalent is the amount of token equivalent to the following _tokenId.
    */
    function setPrice(uint256 _tokenId, uint256 _tokensEquivalent) external {
        require(msg.sender == owner[_tokenId], "not authorized to set price");
        prices[_tokenId] = _tokensEquivalent;
    }
    
    /**
    * @dev this function exchanges ERC20 tokens with ERC721 token, if the price is set for that NFT.
    * @param _assetID is the id of the NFT.
    */
    function exchangeCoins(uint256 _assetID) external {
        require(prices[_assetID] > 0, "this asset is not for sell");
        address currentOwner = owner[_assetID];
        coins.transferFrom(msg.sender, currentOwner, prices[_assetID]);
        delete approved[_assetID];
        balance[currentOwner]--;
        balance[msg.sender]++;
        owner[_assetID] = msg.sender;
    }

    /**
    * @dev approves other account on the behalf of owner for a particular address,
      emits a Approval event.
    * @param _approved is the address which will be approved for a particular tokenId.
    * @param _tokenId is the id of the token.
    */
    function approve(address _approved, uint256 _tokenId) external approvalCheck(_approved) tokenOwnerCheck(msg.sender, _tokenId){
        approved[_tokenId] = _approved;
        emit Approval(msg.sender, _approved, _tokenId);
    }

    /**
    * @dev this function approves an address for all the tokens that msg.sender have,
      emits a ApprovalForAll event.
    * @param _operator is the address which will be approved.
    * @param _approved is the boolean that can be true or false.
    */
    function setApprovalForAll(address _operator, bool _approved) external approvalCheck(_operator) {
        approvalForAll[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    /**
    * @dev this function returns address of the token owner.
    * @param _tokenId is the id the token whose owner is to be found.
    * @return address of the approved account.
    */
    function getApproved(uint256 _tokenId) external view returns (address) {
        return approved[_tokenId];
    }

    /**
    * @dev this function gives information about the account which is approved for all tokenIds.
    * @param _owner is the account of the owner.
    * @param _operator is the approved account.
    * @return true/false as the _operator is approved or not.
    */
    function isApprovedForAll(
        address _owner,
        address _operator
    ) external view returns (bool) {
        return approvalForAll[_owner][_operator];
    }

    /**
    * @dev returns number of tokens in an account.
    * @param _owner An address for whom to query the balance.
    * @return The number of NFTs owned by `_owner`, possibly zero.
    */
    function balanceOf(address _owner) external view returns (uint256) {
        return balance[_owner];
    }
    
    /**
    * @dev returns the address of  owner of a tokenId.
    * @param _tokenId The identifier for an NFT.
    * @return The address of the owner of the NFT.
    */
    function ownerOf(uint256 _tokenId) external view returns (address) {
        return owner[_tokenId];
    }

    /**
    * @dev transfers token to the other account which can be contract account,
    * emits a Transfer event.0x5B38Da6a701c568545dCfcB03FcB875f56beddC4
    * @param _from is the address of the owner of token.
    * @param _to is the address of the receiver of token.
    * @param _tokenId is the token to be transferred.
    * @param _data is the extra data paramater if user wants to send
    */
    function _safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes memory _data
    ) internal {
        _transferFrom(_from, _to, _tokenId);
        uint256 size;
        assembly {
            size := extcodesize(_to)
        }
        require(size > 0, "_to is not a contract account");
        bytes4 returnData = IERC721Receiver(_to).onERC721Received(
            msg.sender,
            _from,
            _tokenId,
            _data
        );
        require(
            returnData ==
            bytes4(abi.encodeWithSignature("onERC721Received(address,address,uint256,bytes)", _from, _to, _tokenId, _data)),
            "_to contract does not implement ERC721Received"
        );
        emit Transfer(_from, _to, _tokenId);
    }

    /**
    * @dev transfers token to the other EOA account, if account is not EOA then token may be permanently locked,
    * emits a Transfer event.
    * @param _from is the address of the owner of token.
    * @param _to is the address of the receiver of token.
    * @param _tokenId is the token to be transferred.
    */
    function _transferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) internal tokenOwnerCheck(_from, _tokenId){
        require(
            msg.sender == _from ||
                approvalForAll[_from][msg.sender] == true ||
                approved[_tokenId] == msg.sender,
            "can not send token"
        );
        delete approved[_tokenId];
        owner[_tokenId] = _to;
        balance[_from] -= 1;
        balance[_to] += 1;
        emit Transfer(_from, _to, _tokenId);
    }

   
}

