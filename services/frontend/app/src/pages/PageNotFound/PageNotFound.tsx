import Background from "../../components/Background";
import { PageNotFoundButton } from "../../components/Buttons";
import Page from "../../components/Page";
import { MenuTitle } from "../../components/PageTitle";

export default function PageNotFound()
{
	return (
		<>
			<Background />
			<Page>
				<MenuTitle title="PAGE NOT FOUND" />
				<PageNotFoundButton />
			</Page>
		</>
	);
}
