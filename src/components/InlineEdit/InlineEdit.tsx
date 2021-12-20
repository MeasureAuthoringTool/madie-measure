import * as React from "react";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  InputHTMLAttributes,
  Ref,
} from "react";
import tw, { styled } from "twin.macro";
import "styled-components/macro";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PencilIcon } from "@heroicons/react/solid";
import {
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import useKeypress from "../../hooks/useKeypress";
import useOnClickOutside from "../../hooks/useOnClickOutside";
import { HelperText } from "@madie/madie-components";

interface ISpanProps extends React.HtmlHTMLAttributes<HTMLSpanElement> {
  // extends React's HTMLAttributes
  isActive: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  ref?: Ref<HTMLSpanElement>;
  text?: string;
}

const ClickableSpan = styled.span((props: ISpanProps) => []);

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

function InlineEdit(props) {
  const [isInputActive, setIsInputActive] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>(props.text);
  const [errorMessage, setErrorMessage] = useState<string>();

  const enter = useKeypress("Enter");
  const esc = useKeypress("Escape");

  const wrapperRef = useRef(null);
  const inputRef = React.createRef<HTMLInputElement>();
  const textRef = useRef<HTMLSpanElement>(null);

  useOnClickOutside(wrapperRef, () => {
    if (isInputActive) {
      save();
    }
  });

  function save() {
    if (inputValue.length > 500) {
      setErrorMessage("A measure name cannot be more than 500 characters.");
    } else if (!inputValue) {
      setErrorMessage("A measure name is required.");
    } else if (!/[a-zA-Z]/.test(inputValue)) {
      setErrorMessage("A measure name must contain at least one letter.");
    } else if (!/^((?!_).)*$/.test(inputValue)) {
      setErrorMessage("Measure Name must not contain '_' (underscores).");
    } else {
      props.onSetText(inputValue);
      setIsInputActive(false);
      setErrorMessage("");
    }
  }

  const onEnter = useCallback(() => {
    if (enter) {
      save();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enter]);

  function cancel() {
    setInputValue(props.text);
    setErrorMessage("");
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
        save();
      }
      // if Escape is pressed, revert the text and close the editor
      if (esc) {
        setInputValue(props.text);
        setIsInputActive(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enter, esc]); // watch the Enter and Escape key presses

  return (
    <div data-testid="outer-area">
      <div data-testid="inline-editor" ref={wrapperRef}>
        {isInputActive ? (
          <div data-testid="inline-edit">
            <StyledInput
              data-testid="inline-edit-input"
              isActive={isInputActive}
              value={inputValue}
              ref={inputRef}
              onChange={(e) => {
                setInputValue(e.target.value);
              }}
            />
            <FontAwesomeIcon
              data-testid="save-edit-measure-name"
              icon={faCheckCircle}
              onClick={() => save()}
            />
            <FontAwesomeIcon icon={faTimesCircle} onClick={cancel} />
          </div>
        ) : (
          <ClickableSpan
            data-testid="inline-view-span"
            isActive={!isInputActive}
            ref={textRef}
            onClick={() => setIsInputActive(true)}
          >
            {props.text}
            <PencilIcon tw="ml-2 w-5 h-5 inline-block" />
          </ClickableSpan>
        )}
      </div>

      {errorMessage && (
        <div>
          <HelperText
            data-testid="edit-measure-name-error-text"
            text={errorMessage}
            isError={true}
          />
        </div>
      )}
    </div>
  );
}

export default InlineEdit;
