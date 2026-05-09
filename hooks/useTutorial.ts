import { useState, useEffect, useCallback } from 'react';
import { TUTORIAL_TOOLTIPS, TooltipConfig } from '../utils/tutorialConfig';

const TUTORIAL_COMPLETE_KEY = 'ekagra_tutorial_complete';
const TOOLTIP_PREFIX = 'ekagra_tooltip_';

export function useTutorial(currentTab: string) {
  const [showIntro, setShowIntro] = useState(false);
  const [currentTooltipStep, setCurrentTooltipStep] = useState(0);
  const [isTooltipActive, setIsTooltipActive] = useState(false);

  const initTutorial = useCallback((isNewUser: boolean) => {
    const completed = localStorage.getItem(TUTORIAL_COMPLETE_KEY);
    if (!completed && isNewUser) {
      setShowIntro(true);
    }
  }, []);

  useEffect(() => {
    const tabKey = TOOLTIP_PREFIX + currentTab;
    const tabDone = localStorage.getItem(tabKey);
    const tutorialComplete = localStorage.getItem(TUTORIAL_COMPLETE_KEY);
    
    if (!tabDone && tutorialComplete && TUTORIAL_TOOLTIPS[currentTab]?.length > 0) {
      const timer = setTimeout(() => {
        setCurrentTooltipStep(0);
        setIsTooltipActive(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentTab]);

  const completeIntro = useCallback(() => {
    localStorage.setItem(TUTORIAL_COMPLETE_KEY, 'true');
    setShowIntro(false);
    setTimeout(() => {
      setCurrentTooltipStep(0);
      setIsTooltipActive(true);
    }, 500);
  }, []);

  const skipIntro = useCallback(() => {
    localStorage.setItem(TUTORIAL_COMPLETE_KEY, 'true');
    setShowIntro(false);
  }, []);

  const nextTooltip = useCallback(() => {
    const tooltips = TUTORIAL_TOOLTIPS[currentTab] || [];
    if (currentTooltipStep < tooltips.length - 1) {
      setCurrentTooltipStep(s => s + 1);
    } else {
      localStorage.setItem(TOOLTIP_PREFIX + currentTab, 'done');
      setIsTooltipActive(false);
      setCurrentTooltipStep(0);
    }
  }, [currentTab, currentTooltipStep]);

  const skipTooltips = useCallback(() => {
    localStorage.setItem(TOOLTIP_PREFIX + currentTab, 'done');
    setIsTooltipActive(false);
    setCurrentTooltipStep(0);
  }, [currentTab]);

  const replayTutorial = useCallback(() => {
    localStorage.removeItem(TUTORIAL_COMPLETE_KEY);
    Object.keys(TUTORIAL_TOOLTIPS).forEach(tab => {
      localStorage.removeItem(TOOLTIP_PREFIX + tab);
    });
    setShowIntro(true);
    setIsTooltipActive(false);
    setCurrentTooltipStep(0);
  }, []);

  const currentTooltips = TUTORIAL_TOOLTIPS[currentTab] || [];
  const currentTooltipConfig = currentTooltips[currentTooltipStep] || null;

  return {
    showIntro,
    isTooltipActive,
    currentTooltipConfig,
    currentTooltipStep: currentTooltipStep + 1,
    totalTooltipSteps: currentTooltips.length,
    initTutorial,
    completeIntro,
    skipIntro,
    nextTooltip,
    skipTooltips,
    replayTutorial,
  };
}
