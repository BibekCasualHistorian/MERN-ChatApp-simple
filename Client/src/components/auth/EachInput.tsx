import { Input } from "../ui/input";

const EachInput = ({
  label,
  type,
  state,
  setState,
  placeholder,
}: {
  label: string;
  state: string;
  type: string;
  autoComplete?: boolean;
  setState: React.Dispatch<React.SetStateAction<string>>;
  placeholder: string;
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      {/* <label htmlFor={label.toLowerCase()} className="font-semibold">
          {label}:
        </label> */}
      <Input
        autoComplete="off"
        type={type}
        required
        className="w-full"
        value={state}
        placeholder={placeholder}
        onChange={(e) => setState(e.target.value)}
      />
    </div>
  );
};

export default EachInput;
