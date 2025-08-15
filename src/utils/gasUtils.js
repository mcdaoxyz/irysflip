import { ethers } from "ethers";

// Fungsi untuk mendapatkan gas fee yang lebih tinggi dari yang disarankan
export async function getEnhancedGasFee(provider, multiplier = 1.5) {
  try {
    // Dapatkan fee data dari network
    const feeData = await provider.getFeeData();
    
    // Prioritas: gunakan EIP-1559 jika tersedia, fallback ke legacy gasPrice
    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      // EIP-1559 transaction
      const enhancedMaxFeePerGas = feeData.maxFeePerGas * BigInt(Math.floor(multiplier * 1000)) / BigInt(1000);
      const enhancedMaxPriorityFeePerGas = feeData.maxPriorityFeePerGas * BigInt(Math.floor(multiplier * 1000)) / BigInt(1000);
      
      return {
        maxFeePerGas: enhancedMaxFeePerGas,
        maxPriorityFeePerGas: enhancedMaxPriorityFeePerGas,
        originalFeeData: feeData
      };
    } else if (feeData.gasPrice) {
      // Legacy transaction
      const enhancedGasPrice = feeData.gasPrice * BigInt(Math.floor(multiplier * 1000)) / BigInt(1000);
      
      return {
        gasPrice: enhancedGasPrice,
        originalFeeData: feeData
      };
    } else {
      // Fallback jika tidak ada fee data
      return {
        gasPrice: ethers.parseUnits('50', 'gwei'),
        originalFeeData: null
      };
    }
  } catch (error) {
    console.error('Error getting enhanced gas fee:', error);
    // Fallback ke gas price sederhana jika gagal
    return {
      gasPrice: ethers.parseUnits('50', 'gwei'), // 50 gwei sebagai fallback
      originalFeeData: null
    };
  }
}

// Fungsi untuk mendapatkan gas limit yang lebih tinggi
export async function getEnhancedGasLimit(contract, methodName, args = [], multiplier = 1.2) {
  try {
    // Estimasi gas limit
    const estimatedGas = await contract[methodName].estimateGas(...args);
    
    // Tambah buffer untuk gas limit
    const enhancedGasLimit = estimatedGas * BigInt(Math.floor(multiplier * 100)) / BigInt(100);
    
    return enhancedGasLimit;
  } catch (error) {
    console.error('Error estimating gas limit:', error);
    // Fallback gas limit
    return BigInt(300000); // 300k gas sebagai fallback
  }
}

// Fungsi untuk membuat transaction options dengan gas fee yang ditingkatkan
export async function createEnhancedTxOptions(provider, contract, methodName, args = [], options = {}) {
  const gasFee = await getEnhancedGasFee(provider, options.gasMultiplier || 1.5);
  const gasLimit = await getEnhancedGasLimit(contract, methodName, args, options.gasLimitMultiplier || 1.2);
  
  return {
    ...options,
    ...gasFee,
    gasLimit: gasLimit
  };
}

// Fungsi untuk mendapatkan gas fee dalam format yang mudah dibaca
export function formatGasFee(feeData) {
  if (!feeData) return 'Unknown';
  
  if (feeData.maxFeePerGas) {
    return `${ethers.formatUnits(feeData.maxFeePerGas, 'gwei')} gwei (max)`;
  } else if (feeData.gasPrice) {
    return `${ethers.formatUnits(feeData.gasPrice, 'gwei')} gwei`;
  }
  
  return 'Unknown';
}

// Fungsi untuk menampilkan perbandingan gas fee
export function compareGasFees(originalFeeData, enhancedFeeData) {
  if (!originalFeeData || !enhancedFeeData) return null;
  
  const comparison = {};
  
  if (originalFeeData.maxFeePerGas && enhancedFeeData.maxFeePerGas) {
    const original = ethers.formatUnits(originalFeeData.maxFeePerGas, 'gwei');
    const enhanced = ethers.formatUnits(enhancedFeeData.maxFeePerGas, 'gwei');
    comparison.maxFeePerGas = {
      original: parseFloat(original),
      enhanced: parseFloat(enhanced),
      increase: ((parseFloat(enhanced) - parseFloat(original)) / parseFloat(original) * 100).toFixed(1)
    };
  }
  
  if (originalFeeData.gasPrice && enhancedFeeData.gasPrice) {
    const original = ethers.formatUnits(originalFeeData.gasPrice, 'gwei');
    const enhanced = ethers.formatUnits(enhancedFeeData.gasPrice, 'gwei');
    comparison.gasPrice = {
      original: parseFloat(original),
      enhanced: parseFloat(enhanced),
      increase: ((parseFloat(enhanced) - parseFloat(original)) / parseFloat(original) * 100).toFixed(1)
    };
  }
  
  return comparison;
}