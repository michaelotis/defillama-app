import React, { useEffect, useState } from 'react'
import { Repeat, X } from 'react-feather'
import { transparentize } from 'polished'
import styled from 'styled-components'
import { TYPE } from 'Theme'
import Layout from 'layout'
import { Panel } from 'components'
import Column from 'components/Column'
import { BasicLink } from 'components/Link'
import Loader from 'components/LocalLoader'
import { AutoRow, RowBetween } from 'components/Row'
import TokenLogo from 'components/TokenLogo'
import { ProtocolsChainsSearch } from 'components/Search'
import { SETS } from 'components/Search/ProtocolsChainsSearch'
import { useMedia } from 'hooks'
import { formattedNum, standardizeProtocolName } from 'utils'
import { useFetchProtocol, useGeckoProtocol } from 'utils/dataApi'

const ComparisonDetailsLayout = styled.div`
  display: inline-grid;
  width: 100%;
  grid-template-columns: 33% 10% 33%;
  column-gap: 30px;
  align-items: center;
  justify-content: center;

  @media screen and (max-width: 1024px) {
    grid-template-columns: 1fr;
    align-items: center;
    justify-items: center;
    > * {
      grid-column: 1 / 4;
      margin-bottom: 1rem;
      display: table-row;
      > * {
        margin-bottom: 1rem;
      }
    }
  }
`

const Wrapper = styled.div`
  padding: 13px 16px;
  background: ${({ theme }) => theme.bg6};
  border: none;
  border-radius: 12px;
  outline: none;
  color: ${({ theme }) => theme.text1};
  font-size: 1rem;
  margin: 0;
  box-shadow: ${({ theme }) => theme.shadow};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  & > * {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-weight: 500;
    font-size: 14px;
  }

  button {
    background: none;
    border: none;
  }

  img {
    width: 20px !important;
    height: 20px !important;
  }
`

const CloseIcon = styled(X)`
  height: 20px;
  width: 20px;
  color: ${({ theme }) => theme.text3};
  :hover {
    cursor: pointer;
  }
`

const ProtocolTitle = styled(TYPE.main)`
  text-align: center;
`

const TokenColoredText = styled.span`
  color: ${({ color }) => (color ? color : 'inherit')};
`

const PriceChange = styled.span`
  color: ${({ priceChange, theme }) => (priceChange === 1 ? 'inherit' : priceChange > 1 ? theme.green1 : theme.red1)};
`

const SwapProtocolsIcon = styled(Repeat)`
  color: white;
  cursor: pointer;

  &:hover {
    transform: scale(1.15);
  }

  @media screen and (max-width: 1024px) {
    margin: 0;
  }
`

const PriceResultPanel = styled(Panel)`
  text-align: center;
  width: auto;
`

const protocolAColor = '#4f8fea'
const protocolBColor = '#fd3c99'
const backgroundColor = '#2172E5'

// assuming price is 0 is not valid
const validTokenData = (tokenData) => !!tokenData?.price && !!tokenData?.name

const useTokenInfoHook = (protocol, protocolsMcapTvl) => {
  // 0 price for unable to query gecko properly
  const [tokenPrice, setTokenPrice] = useState(0)
  // Ability to change currency in future?
  const [defaultCurrency] = useState('usd')
  const { data: tokenData, loading: protocolLoading } = useFetchProtocol(protocol)
  const geckoId = (tokenData && tokenData?.gecko_id) || undefined
  const { data: geckoData, loading: geckoLoading } = useGeckoProtocol(geckoId)
  const geckoPrice = (geckoData || {})?.[geckoId]?.[defaultCurrency]

  useEffect(() => {
    setTokenPrice(geckoPrice)
  }, [geckoPrice])

  return {
    ...tokenData,
    tvl: protocolsMcapTvl[protocol]?.tvl,
    mcap: protocolsMcapTvl[protocol]?.mcap,
    price: tokenPrice,
    loading: protocolLoading || geckoLoading,
  }
}

const DisplayToken = ({ tokenSymbol, logo, address, price, resetDisplay }) => (
  <Wrapper>
    <p>
      <TokenLogo address={address} logo={logo} size={24} />
      <span>{tokenSymbol}</span>
      <span>{formattedNum(price, true)}</span>
    </p>
    <button onClick={resetDisplay}>
      <CloseIcon />
    </button>
  </Wrapper>
)

const TokenComparisonSearch = ({
  protocolAorB,
  tokenValid,
  tokenSymbol,
  logo,
  address,
  price,
  handleLinkPath,
  customOnLinkClick,
}) => (
  <Column>
    <ProtocolTitle mb="1rem">
      <TokenColoredText color={protocolAorB === 'A' ? protocolAColor : protocolBColor}>
        Protocol {protocolAorB}
      </TokenColoredText>
    </ProtocolTitle>
    {tokenValid ? (
      <DisplayToken
        tokenSymbol={tokenSymbol}
        logo={logo}
        address={address}
        price={price}
        resetDisplay={customOnLinkClick(protocolAorB)}
      />
    ) : (
      <ProtocolsChainsSearch
        includedSets={[SETS.PROTOCOLS]}
        customPath={handleLinkPath(protocolAorB)}
        onItemClick={customOnLinkClick(protocolAorB)}
      />
    )}
  </Column>
)

function ComparisonPage(props) {
  const { title, protocolA: protocolARouteParam, protocolB: protocolBRouteParam, protocolsMcapTvl } = props
  const [protocolA, setProtocolA] = useState(protocolARouteParam)
  const [protocolB, setProtocolB] = useState(protocolBRouteParam)

  // Added to initialize protocolA and protocolB from props, on initial render is undefined and useState only initializes the first render
  // https://stackoverflow.com/questions/58818727/react-usestate-not-setting-initial-value
  useEffect(() => {
    setProtocolA(props.protocolA)
  }, [props.protocolA])
  useEffect(() => {
    setProtocolB(props.protocolB)
  }, [props.protocolB])

  const below400 = useMedia('(max-width: 400px)')
  const below1024 = useMedia('(max-width: 1024px)')
  const LENGTH = below1024 ? 10 : 16

  const tokenAData = useTokenInfoHook(protocolA, protocolsMcapTvl)

  const {
    address: tokenAAddress,
    logo: tokenALogo,
    symbol: tokenASymbol,
    price: tokenAPrice,
    mcap: tokenAMcap,
    tvl: tokenATvl,
    loading: loadingA,
  } = tokenAData
  const tokenBData = useTokenInfoHook(protocolB, protocolsMcapTvl)
  const {
    address: tokenBAddress,
    logo: tokenBLogo,
    symbol: tokenBSymbol,
    price: tokenBPrice,
    mcap: tokenBMcap,
    tvl: tokenBTvl,
    loading: loadingB,
  } = tokenBData

  const tokenBMcapTvl = tokenBMcap / tokenBTvl
  const tokenACirculating = tokenAMcap / tokenAPrice
  const tokenAPriceWithTokenBMcapTvl = (tokenBMcapTvl * tokenATvl) / tokenACirculating
  const tokenAPriceChange = tokenAPriceWithTokenBMcapTvl / tokenAPrice

  // format for long symbol
  const tokenAFormattedSymbol = tokenASymbol?.length > LENGTH ? tokenASymbol.slice(0, LENGTH) + '...' : tokenASymbol
  const tokenBFormattedSymbol = tokenBSymbol?.length > LENGTH ? tokenBSymbol.slice(0, LENGTH) + '...' : tokenBSymbol

  const tokenAValid = validTokenData(tokenAData)
  const tokenBValid = validTokenData(tokenBData)

  const handleLinkPath = (protocolAorB) => (clickedProtocol) => {
    const protocolName = standardizeProtocolName(clickedProtocol)
    if (protocolAorB === 'A') {
      return `/comparison?protocolA=${protocolName}&protocolB=${protocolB || ''}`
    } else {
      return `/comparison?protocolA=${protocolA || ''}&protocolB=${protocolName}`
    }
  }

  const handleSwapLinkPath = () => {
    const comparisonRoute = '/comparison'
    // If doesn't have two protocols stay on same page
    if (!tokenAValid || !tokenBValid) return ''
    return `${comparisonRoute}?protocolA=${protocolB}&protocolB=${protocolA}`
  }

  // Update protocol to correct order based off of pathname from user clicking switch button
  useEffect(() => {
    if (protocolA !== protocolARouteParam && tokenAValid && tokenBValid) {
      setProtocolA(protocolARouteParam)
    }
    if (protocolB !== protocolBRouteParam && tokenAValid && tokenBValid) {
      setProtocolB(protocolBRouteParam)
    }
  }, [protocolA, protocolARouteParam, protocolB, protocolBRouteParam, tokenAValid, tokenBValid])

  const customOnLinkClick = (protocolAorB) => (token) => {
    if (protocolAorB === 'A') return setProtocolA(standardizeProtocolName(token?.name))
    return setProtocolB(standardizeProtocolName(token?.name))
  }

  return (
    <Layout title={title} backgroundColor={transparentize(0.6, backgroundColor)}>
      <RowBetween>
        <TYPE.largeHeader fontSize={below400 ? 16 : 24} style={{ width: '100%', textAlign: 'center' }}>
          Calculate the price of <TokenColoredText color={protocolAColor}>Protocol A</TokenColoredText>
          <br />
          with the Mcap/TVL of <TokenColoredText color={protocolBColor}>Protocol B</TokenColoredText>
        </TYPE.largeHeader>
      </RowBetween>
      <RowBetween style={{ flexWrap: 'wrap', alingItems: 'start' }}>
        <ComparisonDetailsLayout>
          <TokenComparisonSearch
            protocolAorB="A"
            tokenValid={tokenAValid}
            tokenSymbol={tokenAFormattedSymbol}
            logo={tokenALogo}
            address={tokenAAddress}
            price={tokenAPrice}
            handleLinkPath={handleLinkPath}
            customOnLinkClick={customOnLinkClick}
          />
          <Column>
            <BasicLink style={{ margin: '2rem auto 0' }} href={handleSwapLinkPath()}>
              <SwapProtocolsIcon onClick={handleSwapLinkPath} />
            </BasicLink>
          </Column>
          <TokenComparisonSearch
            protocolAorB="B"
            tokenValid={tokenBValid}
            tokenSymbol={tokenBFormattedSymbol}
            logo={tokenBLogo}
            address={tokenBAddress}
            price={tokenBPrice}
            handleLinkPath={handleLinkPath}
            customOnLinkClick={customOnLinkClick}
          />
        </ComparisonDetailsLayout>
      </RowBetween>
      {(loadingA || loadingB) && (
        <AutoRow style={{ gap: '1rem', justifyContent: 'center' }}>
          <Loader style={{ width: 'fit-content' }} />{' '}
        </AutoRow>
      )}
      {tokenAValid && tokenBValid && (
        <PriceResultPanel margin="auto" rounded p={20}>
          <Column style={{ gap: '1rem' }}>
            <TYPE.main>
              {tokenAFormattedSymbol} price with the Mcap/TVL of {tokenBFormattedSymbol}
            </TYPE.main>
            <AutoRow style={{ justifyContent: 'center', gap: '7.5px' }}>
              <TokenLogo address={tokenAAddress} logo={tokenALogo} size={32} style={{ alignSelf: 'center' }} />
              <TYPE.largeHeader fontSize={32}>{formattedNum(tokenAPriceWithTokenBMcapTvl, true)}</TYPE.largeHeader>
              <TYPE.main style={{ marginTop: '7.5px' }}>
                <PriceChange priceChange={tokenAPriceChange}>({formattedNum(tokenAPriceChange)}x)</PriceChange>
              </TYPE.main>
            </AutoRow>
          </Column>
        </PriceResultPanel>
      )}
    </Layout>
  )
}

export default ComparisonPage
