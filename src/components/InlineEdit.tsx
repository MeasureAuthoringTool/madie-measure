import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  InputHTMLAttributes,
  Ref,
} from "react";
import tw, { styled } from "twin.macro";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCheckCircle,
  faPenAlt,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import useKeypress from "../hooks/useKeypress";
import useOnClickOutside from "../hooks/useOnClickOutside";
import DOMPurify from "dompurify";
import { PROPERTY_TYPES, tsPropertySignature } from "@babel/types";

interface ISpanProps extends React.HtmlHTMLAttributes<HTMLSpanElement> {
  // extends React's HTMLAttributes
  isActive: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  ref?: Ref<HTMLSpanElement>;
  text?: string;
}

const StyledSpan = styled.span((props: ISpanProps) => []);
const Span = (props: ISpanProps) => (
  <StyledSpan isActive={props.isActive} onClick={props.onClick} ref={props.ref}>
    {props.children}
  </StyledSpan>
);

interface IInputProps extends InputHTMLAttributes<HTMLInputElement> {
  // extends React's HTMLAttributes/
  isActive: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  value?: string;
  ref?: Ref<HTMLInputElement>;
}
const StyledInput = styled.input((props: IInputProps) => [
  !props.isActive && tw`hidden`,
  props.isActive && tw`visible`,
]);

const Input = (props: IInputProps) => (
  <StyledInput isActive={props.isActive} ref={props.ref} />
);

function InlineEdit(props) {
  const [isInputActive, setIsInputActive] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>(props.text);

  const enter = useKeypress("Enter");
  const esc = useKeypress("Escape");

  const wrapperRef = useRef(null);
  const inputRef = React.createRef<HTMLInputElement>();
  const textRef = useRef<HTMLSpanElement>(null);

  const { onSetText } = props;

  useOnClickOutside(wrapperRef, () => {
    if (isInputActive) {
      // save the value and close the editor
      props.onSetText(inputValue);
      setIsInputActive(false);
    }
  });

  function save() {
    onSetText(inputValue);
    setIsInputActive(false);
  }

  const onEnter = useCallback(() => {
    if (enter) {
      save();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enter]);

  function cancel() {
    setInputValue(props.text);
    setIsInputActive(false);
  }

  const onEsc = useCallback(() => {
    if (esc) {
      cancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esc, props.text]);

  useEffect(() => {
    setInputValue(props.text);
  }, [props.text]);

  useEffect(() => {
    if (isInputActive) {
      inputRef.current.focus();
    }
  }, [isInputActive, inputRef]);

  useEffect(() => {
    if (isInputActive) {
      // if Enter is pressed, save the text and close the editor
      onEnter();
      // if Escape is pressed, revert the text and close the editor
      onEsc();
    }
  }, [onEnter, onEsc, isInputActive]); // watch the Enter and Escape key presses

  useEffect(() => {
    if (isInputActive) {
      // if Enter is pressed, save the text and case the editor
      if (enter) {
        props.onSetText(inputValue);
        setIsInputActive(false);
      }
      // if Escape is pressed, revert the text and close the editor
      if (esc) {
        setInputValue(props.text);
        setIsInputActive(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enter, esc]); // watch the Enter and Escape key presses

  const handleInputChange = useCallback(
    (event) => {
      // sanitize the input a little
      setInputValue(DOMPurify.sanitize(event.target.value));
    },
    [setInputValue]
  );

  const handleSpanClick = useCallback(() => {
    setIsInputActive(true);
  }, [setIsInputActive]);

  return (
    <>
      <span data-testid="inline-edit" ref={wrapperRef}>
        {isInputActive ? (
          <>
            <StyledInput
              isActive={isInputActive}
              value={inputValue}
              ref={inputRef}
              onChange={(e) => {
                setInputValue(e.target.value);
              }}
            />
            <FontAwesomeIcon icon={faCheckCircle} onClick={() => save()} />
            <FontAwesomeIcon icon={faTimesCircle} onClick={cancel} />
          </>
        ) : (
          <>
            <Span
              isActive={!isInputActive}
              ref={textRef}
              onClick={handleSpanClick}
            >
              {props.text}
              <FontAwesomeIcon icon={faPenAlt} />
            </Span>
          </>
        )}
      </span>
    </>
  );
}

export default InlineEdit;
