import React from "react";
import { BookOpen } from "lucide-react";

interface ReviewIconProps {
  disabled: boolean;
}

const ReviewIcon = ({ disabled }: ReviewIconProps) => {
  return <BookOpen size={20} color={disabled ? "#8C8C8C" : "#0073C8"} />;
};

export default ReviewIcon;
