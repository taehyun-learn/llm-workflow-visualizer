# 🔬 LLM Workflow Visualizer

실시간 LLM 워크플로우 세션 데이터를 시각화하는 웹 애플리케이션입니다. 
Claude Code의 세션 데이터를 실시간으로 모니터링하고 워크플로우를 직관적으로 분석할 수 있습니다.

## ✨ 주요 기능

- 🔄 **실시간 세션 모니터링**: Live Mode로 새로운 스텝이 추가되는 것을 실시간 감지
- 📊 **3패널 시각화**: Step List, Flow Diagram, Detail View로 구성된 직관적 UI
- 🏷️ **태그 및 필터링**: 세션과 스텝을 태그별, 타입별로 필터링
- 🌙 **다크/라이트 모드**: 완전한 테마 지원
- 📈 **세션 비교**: 원본과 재실행 세션 비교 기능
- 🎯 **단계별 재실행**: 특정 스텝부터 워크플로우 재실행

## 🏗️ 프로젝트 구조

```
llm-workflow-visualizer/
├── backend/                    # Express API 서버
│   ├── server.js              # 메인 서버 파일
│   └── package.json           # 백엔드 의존성
├── frontend/                   # React 프론트엔드
│   ├── src/
│   │   ├── components/        # React 컴포넌트
│   │   │   ├── SessionList.tsx
│   │   │   ├── StepList.tsx
│   │   │   ├── FlowVisualization.tsx
│   │   │   └── StepDrawer.tsx
│   │   ├── types/             # TypeScript 인터페이스
│   │   ├── utils/             # 유틸리티 함수
│   │   └── App.tsx            # 메인 앱 컴포넌트
│   ├── public/
│   │   └── data/              # 데모 세션 파일들
│   └── package.json           # 프론트엔드 의존성
├── package.json               # 통합 실행 스크립트
└── README.md                  # 이 문서
```

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
cd llm-workflow-visualizer
npm run install-all
```

### 2. 애플리케이션 실행
```bash
npm run dev
```

### 3. 브라우저에서 접속
```
http://localhost:5173
```

## 📡 API 엔드포인트

백엔드 서버 (http://localhost:3001)는 다음 API를 제공합니다:

- `GET /api/sessions` - 세션 파일 목록 반환 (최신순)
- `GET /api/session/:id` - 특정 세션의 전체 데이터 반환
- `GET /api/session/latest` - 가장 최근 세션 정보 반환
- `GET /api/events` - Server-Sent Events로 실시간 파일 변경 감지

## 💾 데이터 소스

### 세션 파일 위치
```
C:\claude-code\collector\sessions\
```

### 세션 파일 형식
```
sess-<uuid>-S1-T<timestamp>.json
```

예시: `sess-9e3f31ad-e363-4e88-90a0-5180ab106426-S1-T2025-07-20T165806998Z.json`

### 데이터 구조
```typescript
interface Session {
  sessionId: string;
  title: string;
  createdAt: string;
  steps: Step[];
}

interface Step {
  stepIndex: number;
  type: 'prompt' | 'file_edit' | 'command' | 'assistant_response';
  timestamp: string;
  group: number;
  title?: string;
  tags?: string[];
  data: any;
}
```

## 🔄 실시간 업데이트

### Live Mode 사용법
1. 워크플로우 화면에서 상단 헤더의 "Live Mode" 토글 활성화
2. 현재 세션에 새로운 스텝이 추가되면 자동으로 UI 업데이트
3. 새로운 세션이 생성되면 알림 표시

### 감지 방식
- **Primary**: 1초마다 현재 세션의 스텝 개수 확인
- **Fallback**: Server-Sent Events를 통한 파일 변경 감지

## 🎨 UI 구성

### 세션 선택 화면
- 사용 가능한 모든 세션을 카드 형태로 표시
- 세션별 스텝 개수, 태그, 최종 수정 시간 정보 제공
- 실시간으로 새로운 세션 감지 및 표시

### 워크플로우 화면
- **좌측 패널**: 그룹별로 정리된 스텝 목록 및 검색/필터 기능
- **중앙 패널**: Mermaid를 활용한 플로우 다이어그램
- **우측 패널**: 선택된 스텝의 상세 정보 (Drawer 형태)

## 🛠️ 기술 스택

### 프론트엔드
- **React 19** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **Ant Design** - UI 컴포넌트 라이브러리
- **Mermaid** - 플로우 다이어그램

### 백엔드
- **Node.js** - 런타임
- **Express** - 웹 프레임워크
- **Chokidar** - 파일 시스템 감시
- **CORS** - Cross-Origin Resource Sharing

## 📋 사용 시나리오

### 1. 개발 과정 모니터링
- Claude Code 사용 중 실시간으로 워크플로우 진행 상황 확인
- 각 스텝별 입력과 출력 내용 분석
- 프롬프트 패턴 및 명령어 사용 빈도 파악

### 2. 세션 분석 및 비교
- 완료된 세션들의 워크플로우 패턴 분석
- 서로 다른 접근 방식의 효율성 비교
- 재실행 기능을 통한 개선된 워크플로우 테스트

### 3. 팀 협업
- 팀원들의 워크플로우 공유 및 학습
- 베스트 프랙티스 도출 및 표준화
- 문제 해결 과정 시각화 및 공유

## 🔧 개발 모드

### 개별 실행
```bash
# 백엔드만 실행
npm run server

# 프론트엔드만 실행  
npm run client
```

### 환경 설정
- **프론트엔드**: http://localhost:5173 (Vite HMR)
- **백엔드**: http://localhost:3001 (Express)

## 🐛 문제 해결

### 세션 데이터가 표시되지 않음
1. `C:\claude-code\collector\sessions` 디렉토리 존재 확인
2. 세션 파일 권한 및 형식 확인
3. 백엔드 서버 로그에서 에러 메시지 확인

### Live Mode가 작동하지 않음
1. 브라우저 개발자 도구에서 네트워크 연결 확인
2. 콘솔에서 "Step count changed" 로그 확인
3. 현재 세션 ID가 올바른지 확인

### API 연결 실패
1. 백엔드 서버 실행 상태 확인: `http://localhost:3001/api/sessions`
2. CORS 설정 확인
3. 방화벽 및 포트 사용 상태 확인

## 📈 향후 개선 계획

- [ ] WebSocket을 통한 더 안정적인 실시간 통신
- [ ] 세션 검색 및 필터링 고도화
- [ ] 사용자 정의 태그 시스템
- [ ] 성능 메트릭 및 분석 도구
- [ ] 모바일 반응형 UI 최적화
- [ ] 세션 내보내기 기능 (PDF, JSON)

## 📄 라이센스

이 프로젝트는 개발 및 학습 목적으로 제작되었습니다.


---

**Version**: 1.0.0  
**Compatibility**: Claude Code Collector Sessions
