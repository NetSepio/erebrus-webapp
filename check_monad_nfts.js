const { ethers } = require('ethers');

async function checkMonadNFTs() {
  const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
  const address = '0x99bd4bdd7a9c22e2a35f09a6bd17f038d5e5eb87';
  
  console.log('Checking Monad address:', address);
  
  // Basic ERC721 ABI for checking
  const erc721Abi = [
    'function balanceOf(address owner) view returns (uint256)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function ownerOf(uint256 tokenId) view returns (address)'
  ];
  
  // Test contracts from SocialScan - let's try some common NFT contract addresses
  const testContracts = [
    '0x35ec701d9d99c34417378742ba0aa568c65ec016', // Your original contract
    '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Common test contract
    '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0', // Common test contract
    '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512', // Common test contract
  ];
  
  for (const contractAddr of testContracts) {
    try {
      console.log(`\nChecking contract: ${contractAddr}`);
      const contract = new ethers.Contract(contractAddr, erc721Abi, provider);
      
      const balance = await contract.balanceOf(address);
      console.log(`Balance: ${balance.toString()}`);
      
      if (balance.toString() !== '0') {
        console.log(`✅ Found ${balance} NFTs in contract ${contractAddr}`);
        
        try {
          const name = await contract.name();
          const symbol = await contract.symbol();
          console.log(`Contract: ${name} (${symbol})`);
        } catch (e) {
          console.log('Could not get contract name/symbol');
        }
        
        // Try to get first few tokens
        for (let i = 0; i < Math.min(parseInt(balance.toString()), 3); i++) {
          try {
            const tokenId = await contract.tokenOfOwnerByIndex(address, i);
            console.log(`Token ${i}: ID ${tokenId.toString()}`);
            
            try {
              const tokenURI = await contract.tokenURI(tokenId);
              console.log(`Token URI: ${tokenURI}`);
            } catch (e) {
              console.log(`Could not get tokenURI for token ${tokenId}`);
            }
          } catch (e) {
            console.log(`Could not get token at index ${i}: ${e.message}`);
          }
        }
      }
    } catch (error) {
      console.log(`❌ Error checking contract ${contractAddr}: ${error.message}`);
    }
  }
}

checkMonadNFTs().catch(console.error);
