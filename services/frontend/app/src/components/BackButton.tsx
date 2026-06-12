import { useNavigate } from "react-router-dom";

export default function BackButton()
{
	const navigate = useNavigate();
	
	return <button className="buttonV2 mobileBottom" onClick={ () => navigate(-1) }>Back</button>;
}
