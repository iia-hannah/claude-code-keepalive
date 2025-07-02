# claude-code-keepalive
Claude 사용량을 최대화하세요! claude-code-keepalive가 자동으로 세션을 갱신하여 5시간 사용 창을 완전히 활용할 수 있도록 도와줍니다.

## 🤔 왜 `claude-code-keepalive`가 필요할까?
Claude는 첫 메시지 시점부터 정확히 5시간만 할당량을 제공합니다. 이 5시간 내에 보내는 모든 메시지는 같은 세션에 포함되며, 별도의 세션으로 계산되지 않습니다. 5시간이 지난 후 직접 메시지를 보내 새로운 세션을 시작하면 다시 초기화된 토큰을 사용할 수 있습니다.
Claude의 5시간 세션을 당신의 사용 패턴에 완벽하게 맞춰주는 스마트한 자동화 도구입니다.

##### ❌ 문제 상황
- 오전 9:00: 업무 시작 (세션 시작)
- 오후 12:00: 사용량을 모두 소진
- 오후 2:00: 토큰 초기화될때까지 기다렸다가 세션 재개

##### ✅ 최적화된 상황
- 오전 7:00: 자동으로 세션 시작 (claude-keepalive)
- 오전 9:00: 업무 시작
- 오후 12:00: 사용량을 모두 소진
- 오후 12:00: 자동으로 세션 시작 (claude-keepalive)
- 오후 1:00: 🍽️😋 점심 후 새로운 토큰 사용량 세션으로 오후 업무 시작

## 설치 방법
### 사전 요구사항
- Node.js 18+
- Claude Code CLI 설치 및 인증 완료 

### Quickstart
```bash
npm install -g claude-code-keepalive
```

시작 옵션 1: 오전 7시부터 5시간 간격으로 3번 호출  
```bash
claude-code-keepalive start --mode manual --from "07:00" --interval 5 --count 3
```
시작 옵션 2: 지금부터 5시간마다 자동 호출
```bash
claude-code-keepalive start
```


## Command Usage
```bash
claude-code-keepalive start           # 서비스 시작
claude-code-keepalive stop            # 서비스 중지
claude-code-keepalive status          # 현재 상태 확인
claude-code-keepalive logs            # 로그 확인
```

## 🤝 기여하기
프로젝트에 기여하고 싶으시다면, 이 Repository를 Fork하여 Pull Request을 올리세요!
