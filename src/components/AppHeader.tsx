import { AuthPanel } from "./AuthPanel";
import { PageNav } from "./PageNav";

type AppHeaderProps = {
  isAdminPage: boolean;
  isLoggedIn: boolean;
  onLoggedIn: () => void;
  onLoggedOut: () => void;
};

export function AppHeader({ isAdminPage, isLoggedIn, onLoggedIn, onLoggedOut }: AppHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header-inner">
        <div>
          <h1 className="app-title">
            <span aria-hidden="true">🌈</span>
            <span>出演情報メーカー</span>
          </h1>
        </div>
        <PageNav isAdminPage={isAdminPage} />
        <AuthPanel isLoggedIn={isLoggedIn} onLoggedIn={onLoggedIn} onLoggedOut={onLoggedOut} />
      </div>
    </header>
  );
}
