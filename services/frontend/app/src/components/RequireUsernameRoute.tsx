import { Navigate, Outlet, useLocation, } from "react-router-dom";

import { useCurrentUser } from "../contexts/AuthContext";
import { RoutePath } from "../utils/utils";

export default function RequireUsernameRoute()
{
	const user = useCurrentUser();
	const location = useLocation();

	if (!user.username)
	{
		return (
			<Navigate
				to={RoutePath.completeProfile}
				state={{
					from: location.pathname,
				}}
				replace
			/>
		);
	}

	return <Outlet />;
}
