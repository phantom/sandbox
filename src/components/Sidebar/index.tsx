import React from 'react';
import { PublicKey } from '@solana/web3.js';
import styled from 'styled-components';

import { GRAY, REACT_GRAY, GREEN, PURPLE, WHITE } from '../../constants';

import { hexToRGB } from '../../utils';

import Button from '../Button';
import Emoji from '../Emoji';
import { ConnectedMethods } from '../../App';

// =============================================================================
// Typedefs
// =============================================================================

interface Props {
  publicKey?: PublicKey;
  connectedMethods: ConnectedMethods[];
  connect: () => Promise<void>;
}

// =============================================================================
// Main Component
// =============================================================================

const Sidebar = React.memo((props: Props) => {
  const { publicKey, connectedMethods, connect } = props;

  return (
    <Main>
      <Body>
        <Link>
          <img src="https://phantom.app/img/phantom-logo.svg" alt="Phantom" width="200" />
          <Subtitle>CodeSandbox</Subtitle>
        </Link>
        {publicKey ? (
          // connected
          <>
            <div>
              <Pre>Connected as</Pre>
              <Badge>{publicKey.toBase58()}</Badge>
            </div>
            {connectedMethods.map((method, i) => (
              <Button key={`${method.name}-${i}`} onClick={method.onClick}>
                {method.name}
              </Button>
            ))}
          </>
        ) : (
          // not connected
          <Button onClick={connect}>Connect to Phantom</Button>
        )}
      </Body>
      {/* 😊 💕  */}
      <Tag>
        Made with <Emoji ariaLabel="Red Heart Emoji">❤️</Emoji> by the <span>Phantom</span> team
      </Tag>
    </Main>
  );
});

export default Sidebar;

// =============================================================================
// Styled Components
// =============================================================================

const Main = styled.main`
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  align-items: center;
  background-color: ${REACT_GRAY};
  > * {
    margin-bottom: 10px;
  }
  @media (max-width: 768px) {
    width: 100%;
    height: auto;
  }
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  button {
    margin-bottom: 15px;
  }
`;

const Link = styled.a.attrs({
  href: 'https://phantom.app/',
  target: '_blank',
  rel: 'noopener noreferrer',
})`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-decoration: none;
  margin-bottom: 30px;
  padding: 5px;
  &:focus-visible {
    outline: 2px solid ${hexToRGB(GRAY, 0.5)};
    border-radius: 6px;
  }
`;

const Subtitle = styled.h5`
  color: ${GRAY};
  font-weight: 400;
`;

const Pre = styled.pre`
  margin-bottom: 5px;
`;

const Badge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  padding: 10px;
  color: ${GREEN};
  background-color: ${hexToRGB(GREEN, 0.2)};
  font-size: 14px;
  border-radius: 6px;
  ::selection {
    color: ${WHITE};
    background-color: ${hexToRGB(GREEN, 0.5)};
  }
  ::-moz-selection {
    color: ${WHITE};
    background-color: ${hexToRGB(GREEN, 0.5)};
  }
`;

const Tag = styled.p`
  color: ${GRAY};
  ::selection {
    color: ${WHITE};
    background-color: ${hexToRGB(PURPLE, 0.5)};
  }
  ::-moz-selection {
    color: ${WHITE};
    background-color: ${hexToRGB(PURPLE, 0.5)};
  }
  span {
    color: ${PURPLE};
    ::selection {
      color: ${WHITE};
      background-color: ${hexToRGB(PURPLE, 0.5)};
    }
    ::-moz-selection {
      color: ${WHITE};
      background-color: ${hexToRGB(PURPLE, 0.5)};
    }
  }
`;
