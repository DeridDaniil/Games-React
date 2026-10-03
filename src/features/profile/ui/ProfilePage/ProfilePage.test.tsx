// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProfilePage from './ProfilePage';
import { ProfileProvider } from '../../model/ProfileProvider';
import { loadSession, register, saveProfile } from '../../lib/profileStorage';
import { defaultAvatar, resizeImage } from '../../lib/avatar';
import { getElement, ofType } from '../../../../shared/test/dom';

// jsdom cannot decode images, so the resize is a stand-in; everything else in the module is real.
vi.mock(import('../../lib/avatar'), async (importOriginal) => ({
  ...(await importOriginal()),
  resizeImage: vi.fn(),
}));

const PHOTO = 'data:image/jpeg;base64,PHOTO';

const STATS = {
  tictactoe: { wins: 12, losses: 5, draws: 3 },
  chess: { wins: 1, losses: 2, draws: 0 },
  checkers: { wins: 0, losses: 0, draws: 0 },
};

const renderProfile = () => render(
  <MemoryRouter initialEntries={['/profile']}>
    <ProfileProvider>
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/create" element={<h1>Sign-in page</h1>} />
      </Routes>
    </ProfileProvider>
  </MemoryRouter>
);

const button = (name: string) => ofType(screen.getByRole('button', { name }), HTMLButtonElement);
const gameRow = (name: string) => ofType(screen.getByRole('heading', { level: 3, name }).closest('li'), HTMLLIElement);
const countsOf = (name: string) => getElement(gameRow(name), '.game-stats__counts').textContent;
const overviewValue = (label: string) =>
  within(screen.getByRole('region', { name: 'Overview' })).getByText(label).nextElementSibling?.textContent;
const headerAvatar = (container: HTMLElement) => getElement(container, '.profile-identity__avatar').getAttribute('src');
const editAvatar = (container: HTMLElement) => getElement(container, '.profile-edit__avatar').getAttribute('src');
const fileInput = (container: HTMLElement) => ofType(container.querySelector('input[type="file"]'), HTMLInputElement);
const imageFile = () => new File(['x'], 'photo.png', { type: 'image/png' });

// The signed-in profile as stored; every test here starts with one.
const storedProfile = () => {
  const profile = loadSession();
  if (!profile) throw new Error('Expected a signed-in profile in storage');
  return profile;
};

beforeEach(() => {
  localStorage.clear();
  register('tester', 'Tester', 'secret');
  saveProfile({ ...storedProfile(), stats: STATS });
  vi.mocked(resizeImage).mockReset();
});

afterEach(() => {
  localStorage.clear();
});

describe('ProfilePage', () => {
  describe('header', () => {
    it('shows the player, their login and how many games they played', () => {
      const { container } = renderProfile();

      expect(screen.getByRole('heading', { level: 1, name: 'Tester' })).toBeTruthy();
      expect(screen.getByText('@tester')).toBeTruthy();
      expect(screen.getByText('23 games played')).toBeTruthy();
      expect(headerAvatar(container)).toBe(defaultAvatar);
      expect(button('Edit profile')).toBeTruthy();
    });
  });

  describe('statistics', () => {
    it('adds up all games in the overview', () => {
      renderProfile();

      expect(overviewValue('Games')).toBe('23');
      expect(overviewValue('Wins')).toBe('13');
      expect(overviewValue('Losses')).toBe('7');
      expect(overviewValue('Draws')).toBe('3');
    });

    it('lists the three games with their results in words and the win rate', () => {
      renderProfile();

      expect(countsOf('Tic Tac Toe')).toBe('20 games · 12 wins · 5 losses · 3 draws');
      expect(within(gameRow('Tic Tac Toe')).getByText('60%')).toBeTruthy();
      expect(getElement(gameRow('Tic Tac Toe'), '.game-stats__fill').style.width).toBe('60%');

      expect(countsOf('Chess')).toBe('3 games · 1 win · 2 losses · 0 draws');
      expect(within(gameRow('Chess')).getByText('33%')).toBeTruthy();

      expect(countsOf('Checkers')).toBe('No games yet');
      expect(within(gameRow('Checkers')).getByText('No win rate yet')).toBeTruthy();
    });

    it('explains whose results two-player games record', () => {
      renderProfile();

      expect(screen.getByText(/counts for White in Chess and Checkers and for X in Tic Tac Toe/)).toBeTruthy();
    });
  });

  describe('editing', () => {
    it('opens an edit form with the current name, focused', () => {
      renderProfile();

      fireEvent.click(button('Edit profile'));

      expect(screen.getByRole('heading', { level: 1, name: 'Edit profile' })).toBeTruthy();
      expect(ofType(screen.getByLabelText('Display name'), HTMLInputElement).value).toBe('Tester');
      expect(document.activeElement).toBe(screen.getByLabelText('Display name'));
    });

    it('saves a new name, stores it and returns focus to Edit profile', () => {
      renderProfile();
      fireEvent.click(button('Edit profile'));

      fireEvent.change(screen.getByLabelText('Display name'), { target: { value: '  Renamed  ' } });
      fireEvent.click(button('Save'));

      expect(screen.getByRole('heading', { level: 1, name: 'Renamed' })).toBeTruthy();
      expect(loadSession()?.name).toBe('Renamed');
      expect(document.activeElement).toBe(button('Edit profile'));
    });

    it('drops the changes on Cancel', () => {
      renderProfile();
      fireEvent.click(button('Edit profile'));

      fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'Renamed' } });
      fireEvent.click(button('Cancel'));

      expect(screen.getByRole('heading', { level: 1, name: 'Tester' })).toBeTruthy();
      expect(loadSession()?.name).toBe('Tester');
    });

    it('does not save an empty name and says why', () => {
      renderProfile();
      fireEvent.click(button('Edit profile'));

      fireEvent.change(screen.getByLabelText('Display name'), { target: { value: '   ' } });

      expect(button('Save').disabled).toBe(true);
      expect(screen.getByLabelText('Display name').getAttribute('aria-invalid')).toBe('true');
      expect(screen.getByText('Enter a display name.')).toBeTruthy();
    });

    it('uploads a photo through a named button and keeps it on Save', async () => {
      vi.mocked(resizeImage).mockResolvedValue(PHOTO);
      const { container } = renderProfile();
      fireEvent.click(button('Edit profile'));
      const clickInput = vi.spyOn(fileInput(container), 'click');

      fireEvent.click(button('Upload photo for your profile'));
      expect(clickInput).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('button', { name: 'Remove photo' })).toBeNull();

      fireEvent.change(fileInput(container), { target: { files: [imageFile()] } });

      await waitFor(() => expect(editAvatar(container)).toBe(PHOTO));
      expect(resizeImage).toHaveBeenCalledTimes(1);
      fireEvent.click(button('Save'));

      expect(headerAvatar(container)).toBe(PHOTO);
      expect(loadSession()?.avatar).toBe(PHOTO);
    });

    it('removes a photo back to the default avatar, keeping focus in the photo controls', () => {
      saveProfile({ ...storedProfile(), avatar: PHOTO });
      const { container } = renderProfile();
      fireEvent.click(button('Edit profile'));

      fireEvent.click(button('Remove photo'));

      expect(screen.queryByRole('button', { name: 'Remove photo' })).toBeNull();
      expect(document.activeElement).toBe(button('Upload photo for your profile'));

      fireEvent.click(button('Save'));

      expect(headerAvatar(container)).toBe(defaultAvatar);
      expect(loadSession()?.avatar).toBe(defaultAvatar);
    });

    it('waits for a photo that is still being prepared before it can be saved', async () => {
      let finishResize: (photo: string) => void = () => {};
      vi.mocked(resizeImage).mockImplementation(() => new Promise((resolve) => { finishResize = resolve; }));
      const { container } = renderProfile();
      fireEvent.click(button('Edit profile'));

      fireEvent.change(fileInput(container), { target: { files: [imageFile()] } });

      expect(button('Save').disabled).toBe(true);
      expect(screen.getByText('Preparing the photo…')).toBeTruthy();

      await act(async () => finishResize(PHOTO));

      expect(button('Save').disabled).toBe(false);
      expect(editAvatar(container)).toBe(PHOTO);
    });

    it('drops a photo that was still being prepared when Remove photo was pressed', async () => {
      saveProfile({ ...storedProfile(), avatar: PHOTO });
      let finishResize: (photo: string) => void = () => {};
      vi.mocked(resizeImage).mockImplementation(() => new Promise((resolve) => { finishResize = resolve; }));
      const { container } = renderProfile();
      fireEvent.click(button('Edit profile'));

      fireEvent.change(fileInput(container), { target: { files: [imageFile()] } });
      fireEvent.click(button('Remove photo'));
      await act(async () => finishResize('data:image/jpeg;base64,LATE'));

      expect(editAvatar(container)).toBe(defaultAvatar);
      expect(button('Save').disabled).toBe(false);
    });

    it('announces the same photo error again after another pick', () => {
      const { container } = renderProfile();
      fireEvent.click(button('Edit profile'));
      const pickText = () => fireEvent.change(fileInput(container), {
        target: { files: [new File(['x'], 'notes.txt', { type: 'text/plain' })] },
      });

      pickText();
      const first = screen.getByRole('alert');
      pickText();

      expect(screen.getByRole('alert')).not.toBe(first);
      expect(screen.getByRole('alert').textContent).toBe('Choose an image file.');
    });

    it('explains a file that is not an image', () => {
      const { container } = renderProfile();
      fireEvent.click(button('Edit profile'));

      fireEvent.change(fileInput(container), {
        target: { files: [new File(['x'], 'notes.txt', { type: 'text/plain' })] },
      });

      expect(screen.getByRole('alert').textContent).toBe('Choose an image file.');
      expect(resizeImage).not.toHaveBeenCalled();
    });

    it('explains an image that cannot be read', async () => {
      vi.mocked(resizeImage).mockRejectedValue(new Event('error'));
      const { container } = renderProfile();
      fireEvent.click(button('Edit profile'));

      fireEvent.change(fileInput(container), { target: { files: [imageFile()] } });

      expect((await screen.findByRole('alert')).textContent).toBe('This image could not be read. Try another file.');
      expect(editAvatar(container)).toBe(defaultAvatar);
    });
  });

  describe('resetting a game', () => {
    const openReset = (game: string) => {
      fireEvent.click(button(`Reset ${game} statistics`));
      return screen.getByRole('dialog', { name: `Reset ${game} statistics?` });
    };

    const waitForDialogToClose = () => waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    it('asks first, naming the game and what will be lost', () => {
      renderProfile();

      const dialog = openReset('Chess');

      const description = document.getElementById(dialog.getAttribute('aria-describedby') ?? '');
      expect(description?.textContent).toBe(
        'This will permanently clear the recorded Chess results for this local profile.'
      );
      expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeTruthy();
      expect(within(dialog).getByRole('button', { name: 'Reset' })).toBeTruthy();
    });

    it('keeps the results when cancelled', async () => {
      renderProfile();
      const dialog = openReset('Chess');

      fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      await waitForDialogToClose();
      expect(loadSession()?.stats.chess).toEqual(STATS.chess);
      expect(countsOf('Chess')).toBe('3 games · 1 win · 2 losses · 0 draws');
    });

    it('keeps the results when closed with Escape', async () => {
      renderProfile();
      const dialog = openReset('Chess');

      fireEvent.keyDown(dialog, { key: 'Escape' });

      await waitForDialogToClose();
      expect(loadSession()?.stats.chess).toEqual(STATS.chess);
    });

    it('clears only the chosen game once confirmed', async () => {
      renderProfile();
      const dialog = openReset('Chess');

      fireEvent.click(within(dialog).getByRole('button', { name: 'Reset' }));

      await waitForDialogToClose();
      expect(countsOf('Chess')).toBe('No games yet');
      expect(countsOf('Tic Tac Toe')).toBe('20 games · 12 wins · 5 losses · 3 draws');
      expect(overviewValue('Games')).toBe('20');
      expect(loadSession()?.stats).toEqual({ ...STATS, chess: { wins: 0, losses: 0, draws: 0 } });
    });
  });

  describe('account', () => {
    it('says where the profile is kept', () => {
      renderProfile();

      const account = screen.getByRole('region', { name: 'Account' });
      expect(within(account).getByText(/Profiles and statistics are stored on this device\./)).toBeTruthy();
    });

    it('logs out to the sign-in page and keeps the profile on this device', async () => {
      renderProfile();

      fireEvent.click(button('Log out'));

      expect(await screen.findByRole('heading', { name: 'Sign-in page' })).toBeTruthy();
      expect(loadSession()).toBeNull();
      expect(Object.keys(JSON.parse(localStorage.getItem('games-react-users') ?? '{}'))).toEqual(['tester']);
    });
  });
});
