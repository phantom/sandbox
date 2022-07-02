import React from 'react';
import styled from 'styled-components';

import { TLog } from '../../types';

import { BLACK } from '../../constants';

import Button from '../Button';

import Log from './Log';

// =============================================================================
// Typedefs
// =============================================================================

interface Props {
  logs: TLog[];
  clearLogs: () => void;
}

// =============================================================================
// Main Component
// =============================================================================

const Logs = React.memo((props: Props) => (
  <StyledSection>
    {props.logs.map((log, i) => (
      <Log key={`${log.status}-${log.method}-${i}`} {...log} />
    ))}
    <ClearLogsButton onClick={props.clearLogs}>Clear Logs</ClearLogsButton>
  </StyledSection>
));

export default Logs;

// =============================================================================
// Styled Components
// =============================================================================

const StyledSection = styled.section`
  position: relative;
  flex: 2;
  padding: 20px;
  background-color: ${BLACK};
  overflow: auto;
`;

const ClearLogsButton = styled(Button)`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 100px;
`;
