import type { Dispatch } from 'redux';
import { setFeedback } from '../../../../DesignSystem';
import { awinCheckFeed } from './awinCheckFeed';
import { awinIngestFeed } from './awinIngestFeed';

export const awinSyncFeed = (): any =>
  async (dispatch: Dispatch) => {
    const checkPayload = await dispatch(awinCheckFeed());

    if (checkPayload?.changed === false) {
      dispatch(setFeedback({
        severity: 'success',
        title: 'Feed up to date',
        description: checkPayload?.reason === 'not_modified'
          ? 'The Lookfantastic feed has not changed since the last check.'
          : 'The Lookfantastic feed content matches the latest saved snapshot.',
      }));
      return;
    }

    await dispatch(awinIngestFeed());
  };
