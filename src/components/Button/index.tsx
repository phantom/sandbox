import styled from 'styled-components';

import { WHITE, DARK_GRAY, LIGHT_GRAY } from '../../constants';

import { hexToRGB } from '../../utils';

const Button = styled.button`
  cursor: pointer;
  color: ${WHITE};
  user-select: none;
  font-weight: 600;
  outline: 0;
  width: 100%;
  padding: 15px 10px;
  border: 0;
  border-radius: 6px;
  background-color: ${DARK_GRAY};
  &:hover {
    background-color: ${hexToRGB(LIGHT_GRAY, 0.9)};
  }
  &:focus-visible&:not(:hover) {
    background-color: ${hexToRGB(LIGHT_GRAY, 0.8)};
  }
  &:active {
    background-color: ${LIGHT_GRAY};
  }
`;

export default Button;
