import { Navigate, Outlet, useLocation, } from "react-router-dom";

import Background from "./Background";
import Page from "./Page";
import { MenuTitle } from "./PageTitle";

import { useAuth } from "../contexts/AuthContext";
import { RouteParam, RoutePath, } from "../utils/utils";


export default function ProtectedRoute()
{
    const { auth } = useAuth();
    const location = useLocation();

    if (auth.status === "loading")
        return <Background />;

    if (auth.status === "error")
    {
        return (
            <>
                <Background />
                <Page>
                    <MenuTitle title="Connection error" />
                    <p>
                        Your session could not be restored.
                        Please check the backend connection
                        and refresh the page.
                    </p>
                </Page>
            </>
        );
    }

    if (auth.status !== "authenticated" || !auth.user)
    {
        return (
            <Navigate
                to={ RoutePath.auth + RouteParam.login }
                state={{ from: location.pathname, }}
                replace
            />
        );
    }

    return <Outlet />;
}
