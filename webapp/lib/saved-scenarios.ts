/**
 * Helper functions for saving and loading scenarios to/from database
 */

import { HouseholdInput, SimulationResponse } from '@/lib/types/simulation';

export interface SavedScenario {
  id: string;
  name: string;
  description: string | null;
  scenarioType: string;
  inputData: HouseholdInput;
  results: SimulationResponse | null;
  hasResults: boolean;
  isFavorite: boolean;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch all saved scenarios from the database
 */
export async function loadSavedScenarios(): Promise<SavedScenario[]> {
  try {
    const response = await fetch('/api/saved-scenarios');
    if (!response.ok) {
      throw new Error(`Failed to load scenarios: ${response.statusText}`);
    }
    const data = await response.json();
    return data.scenarios || [];
  } catch (error) {
    console.error('[LOAD SAVED SCENARIOS ERROR]', error);
    return [];
  }
}

/**
 * Save a scenario to the database
 */
export async function saveScenario(params: {
  name: string;
  description?: string;
  scenarioType?: string;
  inputData: HouseholdInput;
  results?: SimulationResponse;
  hasResults?: boolean;
  isFavorite?: boolean;
  tags?: string[];
}): Promise<{ success: boolean; error?: string; requiresPremium?: boolean; scenarioId?: string }> {
  try {
    const response = await fetch('/api/saved-scenarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to save scenario',
        requiresPremium: data.requiresPremium || false,
      };
    }

    return {
      success: true,
      scenarioId: data.scenario.id,
    };
  } catch (error) {
    console.error('[SAVE SCENARIO ERROR]', error);
    return {
      success: false,
      error: 'Failed to save scenario',
    };
  }
}

/**
 * Delete a saved scenario from the database
 */
export async function deleteSavedScenario(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/saved-scenarios/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete scenario: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('[DELETE SAVED SCENARIO ERROR]', error);
    return false;
  }
}

/**
 * Update a saved scenario
 */
export async function updateSavedScenario(
  id: string,
  updates: {
    name?: string;
    description?: string;
    results?: SimulationResponse;
    hasResults?: boolean;
    isFavorite?: boolean;
    tags?: string[];
  }
): Promise<boolean> {
  try {
    const response = await fetch(`/api/saved-scenarios/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update scenario: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('[UPDATE SAVED SCENARIO ERROR]', error);
    return false;
  }
}
