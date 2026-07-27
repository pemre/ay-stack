import { Button, GithubIcon, ProgressPie, RotateCcwIcon } from "@ay/ui-library";
import { type ChangeEvent, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { DashboardBar } from "./components/DashboardBar/DashboardBar";
import NewContentModal from "./components/NewContentModal/NewContentModal";
import ThemeToggle from "./components/ThemeToggle/ThemeToggle";
import { WidgetGrid } from "./components/WidgetGrid/WidgetGrid";
import config from "./config";
import { useContentGraph } from "./hooks/useContentGraph";
import { useProgress } from "./hooks/useProgress";
import { useDashboardStore } from "./stores/dashboardStore.ts";
import "./styles/layout.css";

/**
 * Global state:
 *  selectedId  – clicked timeline/sidebar item id
 *  activeGroup – which group is selected
 */
export default function App() {
  const { t, i18n } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const dashboards = useDashboardStore((s) => s.dashboards);
  const activeDashboardId = useDashboardStore((s) => s.activeDashboardId);
  const resetDashboardLayout = useDashboardStore((s) => s.resetDashboardLayout);

  const activeDashboard = dashboards.find((d) => d.id === activeDashboardId) ?? dashboards[0];

  const { legacyIndex: index, getContent } = useContentGraph();
  const {
    toggleComplete,
    isComplete,
    percentage,
    newContentIds,
    acknowledgeNewContent,
    completedSet,
  } = useProgress(index);

  const handleLanguageChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const lng = e.target.value;
      i18n.changeLanguage(lng);
      document.title = t("app.htmlTitle", { lng });
    },
    [i18n, t],
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-logo">{config.app.logo}</span>
        <h1>{t("app.title")}</h1>

        <DashboardBar />

        {config.features.progressTracker && <ProgressPie percentage={percentage} />}

        {config.features.darkLightToggle && <ThemeToggle />}

        {config.features.draggableLayout && (
          <Button
            variant="icon"
            onClick={() => resetDashboardLayout(activeDashboard.id)}
            aria-label={t("layout.reset")}
            title={t("layout.reset")}
          >
            <RotateCcwIcon size={16} />
          </Button>
        )}

        <select
          className="language-select"
          value={i18n.language}
          onChange={handleLanguageChange}
          aria-label={t("language")}
        >
          {config.app.supportedLocales.map((loc) => (
            <option key={loc.code} value={loc.code}>
              {loc.label}
            </option>
          ))}
        </select>

        <Button
          variant="icon"
          href="https://github.com/pemre/burkut"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          title="GitHub"
        >
          <GithubIcon size={18} />
        </Button>
      </header>

      <div className="app-body">
        <WidgetGrid
          dashboard={activeDashboard}
          index={index}
          getContent={getContent}
          selectedId={selectedId}
          onSelectItem={setSelectedId}
          isComplete={isComplete}
          onToggleComplete={toggleComplete}
          completedSet={completedSet}
        />
      </div>

      {config.features.progressTracker && newContentIds.length > 0 && (
        <NewContentModal
          newContentIds={newContentIds}
          index={index}
          percentage={percentage}
          onDismiss={acknowledgeNewContent}
        />
      )}
    </div>
  );
}
