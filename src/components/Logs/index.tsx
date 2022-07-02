import React from 'react';
import styled from 'styled-components';

import { TLog } from '../../types';

import { BLACK } from '../../constants';

import Log from './Log';

// =============================================================================
// Styled Components
// =============================================================================

const StyledFooter = styled.footer`
  width: 100%;
  margin: 0;
  padding: 20px;
  text-align: left;
  background-color: ${BLACK};
`;

// =============================================================================
// Typedefs
// =============================================================================

interface Props {
  logs: TLog[];
}

// =============================================================================
// Main Component
// =============================================================================

const Logs = React.memo((props: Props) => (
  <StyledFooter>
    {props.logs.map((log, i) => (
      <Log key={`${log.status}-${log.method}-${i}`} {...log} />
    ))}
  </StyledFooter>
));

export default Logs;
