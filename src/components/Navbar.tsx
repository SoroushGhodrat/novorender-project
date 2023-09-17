import React, { useState } from "react";
import "./Navbar.css";

type NavbarProps = {
  onButtonClick: (
    event: React.MouseEvent<HTMLButtonElement>,
    index: number
  ) => void;
  onFormSubmit: (text: string) => void;
};

const Navbar = ({ onButtonClick, onFormSubmit }: NavbarProps) => {
  const [textInput, setTextInput] = useState("");

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTextInput(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onFormSubmit(textInput.trim().toLowerCase());
    setTextInput("");
  };

  return (
    <nav>
      <div className="container">
        <div className="buttons-wrapper">
          <button className="btn" onClick={(event) => onButtonClick(event, 0)}>
            Position 1
          </button>
          <button className="btn" onClick={(event) => onButtonClick(event, 1)}>
            Position 2
          </button>
          <button className="btn" onClick={(event) => onButtonClick(event, 2)}>
            Position 3
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <input
            type="text"
            placeholder="Search objects by name. E.g: chair"
            value={textInput}
            onChange={handleTextChange}
          />
          <button className="btn" type="submit">
            Search
          </button>
        </form>
      </div>
    </nav>
  );
};

export default Navbar;
