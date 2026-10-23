# imgview

도구가 반환한 모든 이미지의 썸네일을 보여 주는 모드입니다.

[English](README.md)

## 왜 필요한가

도구가 이미지를 반환해도 대화 기록에는 경로만 남거나 아무것도 표시되지 않습니다.

- 스크린샷을 Read로 읽어도 터미널을 떠나지 않고는 볼 수 없습니다.
- Playwright 스크린샷은 확인하기 전에 화면 위로 지나갑니다.
- 파일 경로를 직접 복사해 열어야 합니다.

imgview는 도구가 반환한 모든 이미지의 썸네일을 대화 기록의 해당 행에 그리고, 절대 경로를 클릭 가능한 링크로 표시하며, 클릭 한 번으로 파일을 엽니다.

## Install

터미널 세션의 프롬프트에서 다음 명령을 실행합니다.

```
/plugin install imgview --marketplace summerz/imgview
```

마켓플레이스 추가 여부에 `y`로 답하고 범위(scope)를 선택합니다.

- 프롬프트: 위 명령을 실행합니다.
- 셸: `claude plugin install imgview --marketplace summerz/imgview`
- 데스크톱 앱: `/plugin`이 동작하지 않습니다. 프롬프트 입력창 옆의 +를 누르고 Plugins, Add marketplace에 `summerz/imgview`을 입력한 뒤 Add plugin을 누릅니다.

## 기능

- 이미지를 담은 모든 도구 결과에 썸네일을 표시합니다. 이미지 파일을 Read한 결과, Playwright 스크린샷 등이 해당합니다. 이미지를 그리는 터미널(Ghostty, kitty, iTerm2, Orca)에서만 표시됩니다.
- 절대 경로를 클릭 가능한 링크로 표시합니다. 썸네일을 만들 수 없으면(미지원 터미널, 변환 실패) 경로와 `[view]`만 남습니다.
- `[enlarge]`는 이미지를 창에서 엽니다.
- `[view]`는 파일을 기본 브라우저 또는 `viewer`로 지정한 앱에서 엽니다.
- `/imgview`로 가장 최근 이미지를 다시 엽니다.
- 썸네일은 플러그인의 `cache/` 폴더에 캐시됩니다.

## 설정

| 설정 | 기본값 | 동작 |
| --- | --- | --- |
| `viewer` | `browser` | `[view]`로 여는 대상입니다. `browser`는 기본 브라우저이고, 그 외의 값은 `open -a`에 전달할 앱 이름입니다 (예: `Preview`, `Safari`) |

설정 메뉴의 플러그인 항목에서 변경하거나 `~/.claude/settings.json`을 수정합니다.

```json
{ "pluginConfigs": { "imgview": { "viewer": "Preview" } } }
```

## 요구 사항

macOS가 필요합니다. imgview는 `sips`, `open`, `base64`를 호출합니다.

## License

MIT
