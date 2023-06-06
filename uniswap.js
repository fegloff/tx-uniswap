const apiUrl = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3"

const PRIMITIVE_TYPES = ['BigInt', 'string', 'Bytes', 'BigDecimal', 'Timestamp', 'Int', 'ID']

const fetchGraphql = async (queryName, key, graphql) => {
  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  let requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: graphql,
    redirect: 'follow'
  };
  const response = await fetch(apiUrl, requestOptions)
  const data = await response.json();
  return data.data[queryName][key.label]
}

const getDataPoint = (queryName, key) => {
  console.log(queryName,key)
  if (SCHEME[queryName][key]) {
    return SCHEME[queryName][key]
  } else {
    console.error(`Datapoint ${key} doesn't exist or was misspelled. Data Points are written in camelCase`)
    throw `Datapoint ${key} doesn't exist or was misspelled. Data Points are written in camelCase`
  }
}

const getQuery = (queryName, idAddress, dataKey) => {
  let dataPoints = ''
  console.log('getQuery',dataKey)
  if (!PRIMITIVE_TYPES.includes(dataKey.type)) {
    dataPoints += ` ${dataKey.label}{ id } `
  } else {
    dataPoints += ` ${dataKey.label} `;
  }
  console.log('dataPoints', dataPoints)
  return JSON.stringify({
    query: `{ ${queryName}(id: "${idAddress}") { ${dataPoints} } }`
  }) 
}

const setNumberFormat = (amount, formatting) => {
  console.log('forma', typeof amount === 'string')
  let options = { maximumFractionDigits: 6 }
  if (amount.includes('.')) {
    if (formatting === 'usd') {
      options = { ...options, style: 'currency', currency: 'USD' }
    }
    return new Intl.NumberFormat('en-US', options).format(amount)
  }
  return amount
}

const setformatOutput = (queryName, data, formatting = '') => {
  let outPut = []
  outPut = Object.entries(data).map(([key, value]) => {
    console.log(key, value, !isNaN(value))
    if (!isNaN(value) && !key.toLocaleLowerCase().includes('timestamp')) { //
      const formatOutput = setNumberFormat(value, formatting)
      console.log(formatOutput)
      return formatOutput
    } else if (key.toLocaleLowerCase().includes('timestamp')) {
      return Utilities.formatDate(new Date(value), 'PST', 'MM-dd-yyyy HH:mm:ss')
    }
    const dataPointType = SCHEME[queryName][key].type
    if (!PRIMITIVE_TYPES.includes(dataPointType)) {
      return value.id
    }
    return value
  })
  console.log('outPut', outPut)
  return outPut
}

const SCHEME = {
  token: {
    id: { label: 'id', description: 'token address', type: 'ID', default: true },
    symbol: { label: 'symbol', description: 'token symbol', type: 'string', default: true },
    name: { label: 'name', description: 'token name', type: 'string', default: true },
    decimals: { label: 'decimals', description: 'token decimals', type: 'BigInt' },
    totalSupply: { label: 'totalSupply', description: 'token total supply', type: 'BigInt' },
    volume: { label: 'volume', description: 'volume in token units', type: 'BigDecimal' },
    volumeUSD: { label: 'volumeUSD', description: 'volume in derived USD', type: 'BigDecimal' },
    untrackedVolumeUSD: { label: 'untrackedVolumeUSD', description: 'volume in USD even on pools with less reliable USD values', type: 'BigDecimal' },
    feesUSD: { label: 'feesUSD', description: 'fees in USD', type: 'BigDecimal', default: true },
    txCount: { label: 'txCount', description: 'transactions across all pools that include this token', type: 'BigInt' },
    poolCount: { label: 'poolCount', description: 'number of pools containing this token', type: 'BigInt' },
    totalValueLocked: { label: 'totalValueLocked', description: 'liquidity across all pools in token units', type: 'BigDecimal' },
    totalValueLockedUSD: { label: 'totalValueLockedUSD', description: 'liquidity across all pools in derived USD', type: 'BigDecimal' },
    totalValueLockedUSDUntracked: { label: 'totalValueLockedUSDUntracked', description: 'TVL derived in USD untracked', type: 'BigDecimal' },
    derivedETH: { label: 'derivedETH', description: 'derived price in ETH', type: 'BigDecimal' },
    whitelistPools: { label: 'whitelistPools', description: 'pools token is in that are white listed for USD pricing', type: '[Pool]' },
    tokenDayData: { label: 'tokenDayData', description: 'derived fields', type: '[TokenDayData]' },
  },
  swap: {
    id: { label: 'id', description: 'transaction hash + "#" + index in swaps Transaction array', type: 'ID', default: true },
    transaction: { label: 'transaction', description: 'pointer to transaction', type: 'Transaction', default: true },
    timestamp: { label: 'timestamp', description: 'timestamp of transaction', type: 'Timestamp', default: true },
    pool: { label: 'pool', description: 'pool swap occurred within', type: 'Pool' },
    token0: { label: 'token0', description: 'allow indexing by tokens', type: 'Token' },
    token1: { label: 'token1', description: 'allow indexing by tokens', type: 'Token' },
    sender: { label: 'sender', description: 'sender of the swap', type: 'Bytes', default: true },
    recipient: { label: 'recipient', description: 'recipient of the swap', type: 'Bytes', default: true },
    origin: { label: 'origin', description: 'txn origin', type: 'Bytes' },
    amount0: { label: 'amount0', description: 'delta of token0 swapped', type: 'BigDecimal' },
    amount1: { label: 'amount1', description: 'delta of token1 swapped', type: 'BigDecimal' },
    amountUSD: { label: 'amountUSD', description: 'derived info', type: 'BigDecimal', default: true },
    sqrtPriceX96: { label: 'sqrtPriceX96', description: 'The sqrt(price) of the pool after the swap, as a Q64.96', type: 'BigInt' },
    tick: { label: 'tick', description: 'the tick after the swap', type: 'BigInt' },
    logIndex: { label: 'logIndex', description: 'index within the txn', type: 'BigInt' }
  },
  pool: {
    id: { label: 'id', description: 'pool address', type: 'ID', default: true },
    createdAtTimestamp: { label: 'createdAtTimestamp', description: 'creation', type: 'BigInt', default: true },
    createdAtBlockNumber: { label: 'createdAtBlockNumber', description: 'block pool was created at', type: 'BigInt', default: true },
    token0: { label: 'token0', description: 'token0', type: 'Token', default: true },
    token1: { label: 'token1', description: 'token1', type: 'Token', default: true },
    feeTier: { label: 'feeTier', description: 'fee amount', type: 'BigInt', default: true },
    liquidity: { label: 'liquidity', description: 'in-range liquidity', type: 'BigInt', default: true },
    sqrtPrice: { label: 'sqrtPrice', description: 'current price tracker', type: 'BigInt', default: true },
    feeGrowthGlobal0X128: { label: 'feeGrowthGlobal0X128', description: 'tracker for global fee growth', type: 'BigInt' },
    feeGrowthGlobal1X128: { label: 'feeGrowthGlobal1X128', description: 'tracker for global fee growth', type: 'BigInt' },
    token0Price: { label: 'token0Price', description: 'token0 per token1', type: 'BigDecimal' },
    token1Price: { label: 'token1Price', description: 'token1 per token0', type: 'BigDecimal' },
    tick: { label: 'tick', description: 'current tick', type: 'BigInt' },
    observationIndex: { label: 'observationIndex', description: 'current observation index', type: 'BigInt' },
    volumeToken0: { label: 'volumeToken0', description: 'all-time token0 swapped', type: 'BigDecimal' },
    volumeToken1: { label: 'volumeToken1', description: 'all-time token1 swapped', type: 'BigDecimal' },
    volumeUSD: { label: 'volumeUSD', description: 'all-time USD swapped', type: 'BigDecimal' },
    untrackedVolumeUSD: { label: 'untrackedVolumeUSD', description: 'all-time USD swapped, unfiltered for unreliable USD pools', type: 'BigDecimal' },
    feesUSD: { label: 'feesUSD', description: 'fees in USD', type: 'BigDecimal' },
    txCount: { label: 'txCount', description: 'all-time number of transactions', type: 'BigInt' },
    collectedFeesToken0: { label: 'collectedFeesToken0', description: 'all-time fees collected token0', type: 'BigDecimal' },
    collectedFeesToken1: { label: 'collectedFeesToken1', description: 'all-time fees collected token1', type: 'BigDecimal' },
    collectedFeesUSD: { label: 'collectedFeesUSD', description: 'all-time fees collected derived USD', type: 'BigDecimal' },
    totalValueLockedToken0: { label: 'totalValueLockedToken0', description: 'total token 0 across all ticks', type: 'BigDecimal' },
    totalValueLockedToken1: { label: 'totalValueLockedToken1', description: 'total token 1 across all ticks', type: 'BigDecimal' },
    totalValueLockedETH: { label: 'totalValueLockedETH', description: 'tvl derived ETH', type: 'BigDecimal' },
    totalValueLockedUSD: { label: 'totalValueLockedUSD', description: 'tvl USD', type: 'BigDecimal' },
    totalValueLockedUSDUntracked: { label: 'totalValueLockedUSDUntracked', description: 'TVL derived in USD untracked', type: 'BigDecimal' },
    liquidityProviderCount: { label: 'liquidityProviderCount', description: 'used to detect new exchanges', type: 'BigInt' },
    poolHourData: { label: 'poolHourData', description: 'hourly snapshots of pool data', type: '[PoolHourData]' },
    poolDayData: { label: 'poolDayData', description: 'daily snapshots of pool data', type: '[PoolDayData]' },
    mints: { label: 'mints', description: 'derived fields', type: '[Mint]' },
    burns: { label: 'burns', description: 'derived fields', type: '[Burn]' },
    swaps: { label: 'swaps', description: 'derived fields', type: '[Swap]' },
    collects: { label: 'collects', description: 'derived fields', type: '[Collect]' },
    ticks: { label: 'ticks', description: 'derived fields', type: '[Tick]' },
  },
  factory: {
    id: { label: 'id', description: 'factory address', type: 'ID', default: true },
    poolCount: { label: 'poolCount', description: 'amount of pools created', type: 'BigInt', default: true },
    txCount: { label: 'txCount', description: 'amount of transactions all time', type: 'BigInt', default: true },
    totalVolumeUSD: { label: 'totalVolumeUSD', description: 'total volume all time in derived USD', type: 'BigDecimal' },
    totalVolumeETH: { label: 'totalVolumeETH', description: 'total volume all time in derived ETH', type: 'BigDecimal' },
    totalFeesUSD: { label: 'totalFeesUSD', description: 'total swap fees all time in USD', type: 'BigDecimal' },
    totalFeesETH: { label: 'totalFeesETH', description: 'total swap fees all time in ETH', type: 'BigDecimal' },
    untrackedVolumeUSD: { label: 'untrackedVolumeUSD', description: 'all volume even through less reliable USD values', type: 'BigDecimal' },
    totalValueLockedUSD: { label: 'totalValueLockedUSD', description: 'TVL derived in USD', type: 'BigDecimal' },
    totalValueLockedETH: { label: 'totalValueLockedETH', description: 'TVL derived in ETH', type: 'BigDecimal' },
    totalValueLockedUSDUntracked: { label: 'totalValueLockedUSDUntracked', description: 'TVL derived in USD untracked', type: 'BigDecimal' },
    totalValueLockedETHUntracked: { label: 'totalValueLockedETHUntracked', description: 'TVL derived in ETH untracked', type: 'BigDecimal' },
    owner: { label: 'owner', description: 'current owner of the factory', type: 'ID', default: true },
  },
  bundle: {
    id: { label: 'id', description: '', type: 'ID', default: true },
    ethPriceUSD: { label: 'ethPriceUSD', description: 'price of ETH in USD', type: 'BigDecimal', default: true },
  },
  tick: {
    id: { label: 'id', description: 'format: <pool address>#<tick index>', type: 'ID', default: true },
    poolAddress: { label: 'poolAddress', description: 'pool address', type: 'string', default: true },
    tickIdx: { label: 'tickIdx', description: 'tick index', type: 'BigInt', default: true },
    pool: { label: 'pool', description: 'pointer to pool', type: 'Pool' },
    liquidityGross: { label: 'liquidityGross', description: 'total liquidity pool has as tick lower or upper', type: 'BigInt' },
    liquidityNet: { label: 'liquidityNet', description: 'how much liquidity changes when tick crossed', type: 'BigInt' },
    price0: { label: 'price0', description: 'calculated price of token0 of tick within this pool - constant', type: 'BigDecimal' },
    price1: { label: 'price1', description: 'calculated price of token1 of tick within this pool - constant', type: 'BigDecimal' },
    volumeToken0: { label: 'volumeToken0', description: 'lifetime volume of token0 with this tick in range', type: 'BigDecimal' },
    volumeToken1: { label: 'volumeToken1', description: 'lifetime volume of token1 with this tick in range', type: 'BigDecimal' },
    volumeUSD: { label: 'volumeUSD', description: 'lifetime volume in derived USD with this tick in range', type: 'BigDecimal', default: true },
    untrackedVolumeUSD: { label: 'untrackedVolumeUSD', description: 'lifetime volume in untracked USD with this tick in range', type: 'BigDecimal' },
    feesUSD: { label: 'feesUSD', description: 'fees in USD', type: 'BigDecimal', default: true },
    collectedFeesToken0: { label: 'collectedFeesToken0', description: 'all time collected fees in token0', type: 'BigDecimal' },
    collectedFeesToken1: { label: 'collectedFeesToken1', description: 'all time collected fees in token1', type: 'BigDecimal' },
    collectedFeesUSD: { label: 'collectedFeesUSD', description: 'all time collected fees in USD', type: 'BigDecimal' },
    createdAtTimestamp: { label: 'createdAtTimestamp', description: 'created time', type: 'BigInt', default: true },
    createdAtBlockNumber: { label: 'createdAtBlockNumber', description: 'created block', type: 'BigInt' },
    liquidityProviderCount: { label: 'liquidityProviderCount', description: 'used to detect new exchanges', type: 'BigInt' },
    feeGrowthOutside0X128: { label: 'feeGrowthOutside0X128', description: 'vars needed for fee computation', type: 'BigInt' },
    feeGrowthOutside1X128: { label: 'feeGrowthOutside1X128', description: 'vars needed for fee computation', type: 'BigInt' },
  },
  position: {
    id: { label: 'id', description: 'NFT token id', type: 'ID', default: true },
    owner: { label: 'owner', description: 'owner of the NFT', type: 'Bytes', default: true },
    pool: { label: 'pool', description: 'pool position is within', type: 'Pool', default: true },
    token0: { label: 'token0', description: 'allow indexing by tokens', type: 'Token', default: true },
    token1: { label: 'token1', description: 'allow indexing by tokens', type: 'Token', default: true },
    tickLower: { label: 'tickLower', description: 'lower tick of the position', type: 'Tick', default: true },
    tickUpper: { label: 'tickUpper', description: 'upper tick of the position', type: 'Tick', default: true },
    liquidity: { label: 'liquidity', description: 'total position liquidity', type: 'BigInt' },
    depositedToken0: { label: 'depositedToken0', description: 'amount of token 0 ever deposited to position', type: 'BigDecimal' },
    depositedToken1: { label: 'depositedToken1', description: 'amount of token 1 ever deposited to position', type: 'BigDecimal' },
    withdrawnToken0: { label: 'withdrawnToken0', description: 'amount of token 0 ever withdrawn from position (without fees)', type: 'BigDecimal' },
    withdrawnToken1: { label: 'withdrawnToken1', description: 'amount of token 1 ever withdrawn from position (without fees)', type: 'BigDecimal' },
    collectedFeesToken0: { label: 'collectedFeesToken0', description: 'all time collected fees in token0', type: 'BigDecimal' },
    collectedFeesToken1: { label: 'collectedFeesToken1', description: 'all time collected fees in token1', type: 'BigDecimal' },
    transaction: { label: 'transaction', description: 'tx in which the position was initialized', type: 'Transaction', default: true },
    feeGrowthInside0LastX128: { label: 'feeGrowthInside0LastX128', description: 'vars needed for fee computation', type: 'BigInt' },
    feeGrowthInside1LastX128: { label: 'feeGrowthInside1LastX128', description: 'vars needed for fee computation', type: 'BigInt' },
  },
  positionSnapshot: {
    id: { label: 'id', description: '<NFT token id>#<block number>', type: 'ID' },
    owner: { label: 'owner', description: 'owner of the NFT', type: 'Bytes' },
    pool: { label: 'pool', description: 'pool the position is within', type: 'Pool' },
    position: { label: 'position', description: 'position of which the snap was taken of', type: 'Position' },
    blockNumber: { label: 'blockNumber', description: 'block in which the snap was created', type: 'BigInt' },
    timestamp: { label: 'timestamp', description: 'timestamp of block in which the snap was created', type: 'BigInt' },
    liquidity: { label: 'liquidity', description: 'total position liquidity', type: 'BigInt' },
    depositedToken0: { label: 'depositedToken0', description: 'amount of token 0 ever deposited to position', type: 'BigDecimal' },
    depositedToken1: { label: 'depositedToken1', description: 'amount of token 1 ever deposited to position', type: 'BigDecimal' },
    withdrawnToken0: { label: 'withdrawnToken0', description: 'amount of token 0 ever withdrawn from position (without fees)', type: 'BigDecimal' },
    withdrawnToken1: { label: 'withdrawnToken1', description: 'amount of token 1 ever withdrawn from position (without fees)', type: 'BigDecimal' },
    collectedFeesToken0: { label: 'collectedFeesToken0', description: 'all time collected fees in token0', type: 'BigDecimal' },
    collectedFeesToken1: { label: 'collectedFeesToken1', description: 'all time collected fees in token1', type: 'BigDecimal' },
    transaction: { label: 'transaction', description: 'tx in which the snapshot was initialized', type: 'Transaction' },
    feeGrowthInside0LastX128: { label: 'feeGrowthInside0LastX128', description: 'internal vars needed for fee computation', type: 'BigInt' },
    feeGrowthInside1LastX128: { label: 'feeGrowthInside1LastX128', description: 'internal vars needed for fee computation', type: 'BigInt' },
  },
  transaction: {
    id: { label: 'id', description: 'txn hash', type: 'ID' },
    blockNumber: { label: 'blockNumber', description: 'block txn was included in', type: 'BigInt' },
    timestamp: { label: 'timestamp', description: 'timestamp txn was confirmed', type: 'BigInt' },
    gasUsed: { label: 'gasUsed', description: 'gas used during txn execution', type: 'BigInt' },
    gasPrice: { label: 'gasPrice', description: 'gas price', type: 'BigInt' },
    mints: { label: 'mints', description: 'associated mints', type: '[Mint]', derivedFrom: 'transaction' },
    burns: { label: 'burns', description: 'associated burns', type: '[Burn]', derivedFrom: 'transaction' },
    swaps: { label: 'swaps', description: 'associated swaps', type: '[Swap]', derivedFrom: 'transaction' },
    flashed: { label: 'flashed', description: 'associated flashes', type: '[Flash]', derivedFrom: 'transaction' },
    collects: { label: 'collects', description: 'associated collects', type: '[Collect]', derivedFrom: 'transaction' },
  },
  mint: {
    id: { label: 'id', description: 'transaction hash + "#" + index in mints Transaction array', type: 'ID' },
    transaction: { label: 'transaction', description: 'which txn the mint was included in', type: 'Transaction' },
    timestamp: { label: 'timestamp', description: 'time of txn', type: 'BigInt' },
    pool: { label: 'pool', description: 'pool position is within', type: 'Pool' },
    token0: { label: 'token0', description: 'allow indexing by tokens', type: 'Token' },
    token1: { label: 'token1', description: 'allow indexing by tokens', type: 'Token' },
    owner: { label: 'owner', description: 'owner of position where liquidity minted to', type: 'Bytes' },
    sender: { label: 'sender', description: 'the address that minted the liquidity', type: 'Bytes' },
    origin: { label: 'origin', description: 'txn origin', type: 'Bytes' },
    amount: { label: 'amount', description: 'amount of liquidity minted', type: 'BigInt' },
    amount0: { label: 'amount0', description: 'amount of token 0 minted', type: 'BigDecimal' },
    amount1: { label: 'amount1', description: 'amount of token 1 minted', type: 'BigDecimal' },
    amountUSD: { label: 'amountUSD', description: 'derived amount based on available prices of tokens', type: 'BigDecimal' },
    tickLower: { label: 'tickLower', description: 'lower tick of the position', type: 'BigInt' },
    tickUpper: { label: 'tickUpper', description: 'upper tick of the position', type: 'BigInt' },
    logIndex: { label: 'logIndex', description: 'order within the txn', type: 'BigInt' },
  },
  burn: {
    id: { label: 'id', description: 'transaction hash + "#" + index in mints Transaction array', type: 'ID' },
    transaction: { label: 'transaction', description: 'txn burn was included in', type: 'Transaction' },
    pool: { label: 'pool', description: 'pool position is within', type: 'Pool' },
    token0: { label: 'token0', description: 'allow indexing by tokens', type: 'Token' },
    token1: { label: 'token1', description: 'allow indexing by tokens', type: 'Token' },
    timestamp: { label: 'timestamp', description: 'need this to pull recent txns for specific token or pool', type: 'BigInt' },
    owner: { label: 'owner', description: 'owner of position where liquidity was burned', type: 'Bytes' },
    origin: { label: 'origin', description: 'txn origin', type: 'Bytes' },
    amount: { label: 'amount', description: 'amouny of liquidity burned', type: 'BigInt' },
    amount0: { label: 'amount0', description: 'amount of token 0 burned', type: 'BigDecimal' },
    amount1: { label: 'amount1', description: 'amount of token 1 burned', type: 'BigDecimal' },
    amountUSD: { label: 'amountUSD', description: 'derived amount based on available prices of tokens', type: 'BigDecimal' },
    tickLower: { label: 'tickLower', description: 'lower tick of position', type: 'BigInt' },
    tickUpper: { label: 'tickUpper', description: 'upper tick of position', type: 'BigInt' },
    logIndex: { label: 'logIndex', description: 'position within the transactions', type: 'BigInt' },
  },
  collect: {
    id: { label: 'id', description: 'transaction hash + "#" + index in collect Transaction array', type: 'ID' },
    transaction: { label: 'transaction', description: 'pointer to txn', type: 'Transaction' },
    timestamp: { label: 'timestamp', description: 'timestamp of event', type: 'BigInt' },
    pool: { label: 'pool', description: 'pool collect occured within', type: 'Pool' },
    owner: { label: 'owner', description: 'owner of position collect was performed on', type: 'Bytes' },
    amount0: { label: 'amount0', description: 'amount of token0 collected', type: 'BigDecimal' },
    amount1: { label: 'amount1', description: 'amount of token1 collected', type: 'BigDecimal' },
    amountUSD: { label: 'amountUSD', description: 'derived amount based on available prices of tokens', type: 'BigDecimal' },
    tickLower: { label: 'tickLower', description: 'lower tick of position', type: 'BigInt' },
    tickUpper: { label: 'tickUpper', description: 'upper tick of position', type: 'BigInt' },
    logIndex: { label: 'logIndex', description: 'index within the txn', type: 'BigInt' },
  },
  flash: {
    id: { label: 'id', description: 'transaction hash + "-" + index in collect Transaction array', type: 'ID' },
    transaction: { label: 'transaction', description: 'pointer to txn', type: 'Transaction' },
    timestamp: { label: 'timestamp', description: 'timestamp of event', type: 'BigInt' },
    pool: { label: 'pool', description: 'pool collect occured within', type: 'Pool' },
    sender: { label: 'sender', description: 'sender of the flash', type: 'Bytes' },
    recipient: { label: 'recipient', description: 'recipient of the flash', type: 'Bytes' },
    amount0: { label: 'amount0', description: 'amount of token0 flashed', type: 'BigDecimal' },
    amount1: { label: 'amount1', description: 'amount of token1 flashed', type: 'BigDecimal' },
    amountUSD: { label: 'amountUSD', description: 'derived amount based on available prices of tokens', type: 'BigDecimal' },
    amount0Paid: { label: 'amount0Paid', description: 'amount token0 paid for flash', type: 'BigDecimal' },
    amount1Paid: { label: 'amount1Paid', description: 'amount token1 paid for flash', type: 'BigDecimal' },
    logIndex: { label: 'logIndex', description: 'index within the txn', type: 'BigInt' },
  },
  uniswapDayData: {
    id: { label: 'id', description: 'timestamp rounded to current day by dividing by 86400', type: 'ID' },
    date: { label: 'date', description: 'timestamp rounded to current day by dividing by 86400', type: 'Int' },
    volumeETH: { label: 'volumeETH', description: 'total daily volume in Uniswap derived in terms of ETH', type: 'BigDecimal' },
    volumeUSD: { label: 'volumeUSD', description: 'total daily volume in Uniswap derived in terms of USD', type: 'BigDecimal' },
    volumeUSDUntracked: { label: 'volumeUSDUntracked', description: 'total daily volume in Uniswap derived in terms of USD untracked', type: 'BigDecimal' },
    feesUSD: { label: 'feesUSD', description: 'fees in USD', type: 'BigDecimal' },
    txCount: { label: 'txCount', description: 'number of daily transactions', type: 'BigInt' },
    tvlUSD: { label: 'tvlUSD', description: 'tvl in terms of USD', type: 'BigDecimal' },
  },
  poolDayData: {
    id: { label: 'id', description: 'timestamp rounded to current day by dividing by 86400', type: 'ID' },
    date: { label: 'date', description: 'timestamp rounded to current day by dividing by 86400', type: 'Int' },
    pool: { label: 'pool', description: 'pointer to pool', type: 'Pool' },
    liquidity: { label: 'liquidity', description: 'in-range liquidity at the end of the period', type: 'BigInt' },
    sqrtPrice: { label: 'sqrtPrice', description: 'current price tracker at the end of the period', type: 'BigInt' },
    token0Price: { label: 'token0Price', description: 'price of token0 derived from sqrtPrice', type: 'BigDecimal' },
    token1Price: { label: 'token1Price', description: 'price of token1 derived from sqrtPrice', type: 'BigDecimal' },
    tick: { label: 'tick', description: 'current tick at the end of the period', type: 'BigInt' },
    feeGrowthGlobal0X128: { label: 'feeGrowthGlobal0X128', description: 'tracker for global fee growth', type: 'BigInt' },
    feeGrowthGlobal1X128: { label: 'feeGrowthGlobal1X128', description: 'tracker for global fee growth', type: 'BigInt' },
    tvlUSD: { label: 'tvlUSD', description: 'tvl derived in USD at the end of the period', type: 'BigDecimal' },
    volumeToken0: { label: 'volumeToken0', description: 'volume in token0', type: 'BigDecimal' },
    volumeToken1: { label: 'volumeToken1', description: 'volume in token1', type: 'BigDecimal' },
    volumeUSD: { label: 'volumeUSD', description: 'volume in USD', type: 'BigDecimal' },
    feesUSD: { label: 'feesUSD', description: 'fees in USD', type: 'BigDecimal' },
    txCount: { label: 'txCount', description: 'number of transactions during the period', type: 'BigInt' },
    open: { label: 'open', description: 'opening price of token0', type: 'BigDecimal' },
    high: { label: 'high', description: 'high price of token0', type: 'BigDecimal' },
    low: { label: 'low', description: 'low price of token0', type: 'BigDecimal' },
    close: { label: 'close', description: 'close price of token0', type: 'BigDecimal' },
  },
  poolHourData: {
    id: { label: 'id', description: 'format: <pool address>-<timestamp>', type: 'ID' },
    periodStartUnix: { label: 'periodStartUnix', description: 'Unix timestamp for the start of the hour', type: 'Int' },
    pool: { label: 'pool', description: 'pointer to pool', type: 'Pool' },
    liquidity: { label: 'liquidity', description: 'in-range liquidity at the end of the period', type: 'BigInt' },
    sqrtPrice: { label: 'sqrtPrice', description: 'current price tracker at the end of the period', type: 'BigInt' },
    token0Price: { label: 'token0Price', description: 'price of token0 derived from sqrtPrice', type: 'BigDecimal' },
    token1Price: { label: 'token1Price', description: 'price of token1 derived from sqrtPrice', type: 'BigDecimal' },
    tick: { label: 'tick', description: 'current tick at the end of the period', type: 'BigInt' },
    feeGrowthGlobal0X128: { label: 'feeGrowthGlobal0X128', description: 'tracker for global fee growth', type: 'BigInt' },
    feeGrowthGlobal1X128: { label: 'feeGrowthGlobal1X128', description: 'tracker for global fee growth', type: 'BigInt' },
    tvlUSD: { label: 'tvlUSD', description: 'tvl derived in USD at the end of the period', type: 'BigDecimal' },
    volumeToken0: { label: 'volumeToken0', description: 'volume in token0', type: 'BigDecimal' },
    volumeToken1: { label: 'volumeToken1', description: 'volume in token1', type: 'BigDecimal' },
    volumeUSD: { label: 'volumeUSD', description: 'volume in USD', type: 'BigDecimal' },
    feesUSD: { label: 'feesUSD', description: 'fees in USD', type: 'BigDecimal' },
    txCount: { label: 'txCount', description: 'number of transactions during the period', type: 'BigInt' },
    open: { label: 'open', description: 'opening price of token0', type: 'BigDecimal' },
    high: { label: 'high', description: 'high price of token0', type: 'BigDecimal' },
    low: { label: 'low', description: 'low price of token0', type: 'BigDecimal' },
    close: { label: 'close', description: 'close price of token0', type: 'BigDecimal' },
  },
  tickHourData: {
    id: { label: 'id', description: 'format: <pool address>-<tick index>-<timestamp>', type: 'ID' },
    periodStartUnix: { label: 'periodStartUnix', description: 'unix timestamp for start of hour', type: 'Int' },
    pool: { label: 'pool', description: 'pointer to pool', type: 'Pool' },
    tick: { label: 'tick', description: 'pointer to tick', type: 'Tick' },
    liquidityGross: { label: 'liquidityGross', description: 'total liquidity pool has as tick lower or upper at end of period', type: 'BigInt' },
    liquidityNet: { label: 'liquidityNet', description: 'how much liquidity changes when tick crossed at end of period', type: 'BigIn' },
    volumeToken0: { label: 'volumeToken0', description: 'hourly volume of token0 with this tick in range', type: 'BigDecimal' },
    volumeToken1: { label: 'volumeToken1', description: 'hourly volume of token1 with this tick in range', type: 'BigDecimal' },
    volumeUSD: { label: 'volumeUSD', description: 'hourly volume in derived USD with this tick in range', type: 'BigDecimal' },
    feesUSD: { label: 'feesUSD', description: 'fees in USD', type: 'BigDecimal' },
  },
  tickDayData: {
    id: { label: 'id', description: 'format: <pool address>-<tick index>-<timestamp>', type: 'ID' },
    date: { label: 'date', description: 'timestamp rounded to current day by dividing by 86400', type: 'Int' },
    pool: { label: 'pool', description: 'pointer to pool', type: 'Pool' },
    tick: { label: 'tick', description: 'pointer to tick', type: 'Tick' },
    liquidityGross: { label: 'liquidityGross', description: 'total liquidity pool has as tick lower or upper at end of period', type: 'BigInt' },
    liquidityNet: { label: 'liquidityNet', description: 'how much liquidity changes when tick crossed at end of period', type: 'BigInt' },
    volumeToken0: { label: 'volumeToken0', description: 'hourly volume of token0 with this tick in range', type: 'BigDecimal' },
    volumeToken1: { label: 'volumeToken1', description: 'hourly volume of token1 with this tick in range', type: 'BigDecimal' },
    volumeUSD: { label: 'volumeUSD', description: 'hourly volume in derived USD with this tick in range', type: 'BigDecimal' },
    feesUSD: { label: 'feesUSD', description: 'fees in USD', type: 'BigDecimal' },
    feeGrowthOutside0X128: { label: 'feeGrowthOutside0X128', description: 'vars needed for fee computation', type: 'BigInt' },
    feeGrowthOutside1X128: { label: 'feeGrowthOutside1X128', description: 'vars needed for fee computation', type: 'BigInt' },
  },
  tokenDayData: {
    id: { label: 'id', description: 'token address concatenated with date', type: 'ID' },
    date: { label: 'date', description: 'timestamp rounded to current day by dividing by 86400', type: 'Int' },
    token: { label: 'token', description: 'pointer to token', type: 'Token' },
    volume: { label: 'volume', description: 'volume in token units', type: 'BigDecimal' },
    volumeUSD: { label: 'volumeUSD', description: 'volume in derived USD', type: 'BigDecimal' },
    untrackedVolumeUSD: { label: 'untrackedVolumeUSD', description: 'volume in USD even on pools with less reliable USD values', type: 'BigDecimal' },
    totalValueLocked: { label: 'totalValueLocked', description: 'liquidity across all pools in token units', type: 'BigDecimal' },
    totalValueLockedUSD: { label: 'totalValueLockedUSD', description: 'liquidity across all pools in derived USD', type: 'BigDecimal' },
    priceUSD: { label: 'priceUSD', description: 'price at end of period in USD', type: 'BigDecimal' },
    feesUSD: { label: 'feesUSD', description: 'fees in USD', type: 'BigDecimal' },
    open: { label: 'open', description: 'opening price USD', type: 'BigDecimal' },
    high: { label: 'high', description: 'high price USD', type: 'BigDecimal' },
    low: { label: 'low', description: 'low price USD', type: 'BigDecimal' },
    close: { label: 'close', description: 'close price USD', type: 'BigDecimal' },
  },
  tokenHourData: {
    id: { label: 'id', description: 'token address concatenated with date', type: 'ID' },
    periodStartUnix: { label: 'periodStartUnix', description: 'unix timestamp for start of hour', type: 'Int' },
    token: { label: 'token', description: 'pointer to token', type: 'Token' },
    volume: { label: 'volume', description: 'volume in token units', type: 'BigDecimal' },
    volumeUSD: { label: 'volumeUSD', description: 'volume in derived USD', type: 'BigDecimal' },
    untrackedVolumeUSD: { label: 'untrackedVolumeUSD', description: 'volume in USD even on pools with less reliable USD values', type: 'BigDecimal' },
    totalValueLocked: { label: 'totalValueLocked', description: 'liquidity across all pools in token units', type: 'BigDecimal' },
    totalValueLockedUSD: { label: 'totalValueLockedUSD', description: 'liquidity across all pools in derived USD', type: 'BigDecimal' },
    priceUSD: { label: 'priceUSD', description: 'price at end of period in USD', type: 'BigDecimal' },
    feesUSD: { label: 'feesUSD', description: 'fees in USD', type: 'BigDecimal' },
    open: { label: 'open', description: 'opening price USD', type: 'BigDecimal' },
    high: { label: 'high', description: 'high price USD', type: 'BigDecimal' },
    low: { label: 'low', description: 'low price USD', type: 'BigDecimal' },
    close: { label: 'close', description: 'close price USD', type: 'BigDecimal' },
  }
}