import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const useBackNavigation = () => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  return { goBack, BackIcon: ArrowLeft };
};