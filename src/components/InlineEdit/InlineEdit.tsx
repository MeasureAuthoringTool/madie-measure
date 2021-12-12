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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faPenAlt,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import useKeypress from "../../hooks/useKeypress";
import useOnClickOutside from "../../hooks/useOnClickOutside";
import DOMPurify from "dompurify";

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

  const enter = useKeypress("Enter");
  const esc = useKeypress("Escape");

  const wrapperRef = useRef(null);
  const inputRef = React.createRef<HTMLInputElement>();
  const textRef = useRef<HTMLSpanElement>(null);

  const { onSetText } = props;

  useOnClickOutside(wrapperRef, () => {
    if (isInputActive) {
      save();
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
    <div data-testid="outer-area">
      <span data-testid="inline-editor" ref={wrapperRef}>
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
            <FontAwesomeIcon icon={faCheckCircle} onClick={() => save()} />
            <FontAwesomeIcon icon={faTimesCircle} onClick={cancel} />
          </div>
        ) : (
          <div data-testid="inline-view">
            <ClickableSpan
              data-testid="inline-view-span"
              isActive={!isInputActive}
              ref={textRef}
              onClick={handleSpanClick}
            >
              {props.text}
              <FontAwesomeIcon icon={faPenAlt} />
            </ClickableSpan>
          </div>
        )}
      </span>
    </div>
  );
}

export default InlineEdit;
