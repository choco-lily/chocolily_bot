import graphviz

def create_bot_class_diagram():
    dot = graphviz.Digraph(comment='Discord Bot Class Diagram')
    dot.attr(rankdir='TB')
    
    # 폰트 설정
    dot.attr('graph', fontname='Malgun Gothic')
    dot.attr('node', fontname='Malgun Gothic')
    dot.attr('edge', fontname='Malgun Gothic')
    
    # 클래스 스타일 설정
    dot.attr('node', shape='box')
    
    # 메인 클래스
    dot.node('Client', 'Client')
    dot.node('Client_attrs', 'client: Discord.Client\ncommands: Collection\ndb: Database\ndashboard: Express\nconfig: Config')
    dot.edge('Client', 'Client_attrs')
    
    # 명령어 클래스들
    commands = {
        'RPSCommand': 'name: string\ndescription: string\nexecute(interaction): Promise<void>\nhandleGame(interaction): Promise<void>\nupdateStats(winner): Promise<void>',
        'FortuneCommand': 'name: string\ndescription: string\nexecute(interaction): Promise<void>\ngetFortune(): string',
        'TarotCommand': 'name: string\ndescription: string\nexecute(interaction): Promise<void>\ndrawCards(): Card[]\ninterpretCards(cards): string',
        'DiceCommand': 'name: string\ndescription: string\nexecute(interaction): Promise<void>\nrollDice(notation): number[]'
    }
    
    # 명령어 클래스 추가
    for name, content in commands.items():
        dot.node(name, name)
        dot.node(f'{name}_attrs', content)
        dot.edge(name, f'{name}_attrs')
        dot.edge('Client', name, 'uses')
    
    # 유틸리티 클래스들
    utils = {
        'Database': 'getStats(): Promise<Stats>\nupdateStats(data): Promise<void>\ngetServerSettings(): Promise<Settings>\nupdateServerSettings(settings): Promise<void>',
        'Config': 'token: string\nclientId: string\nguildId: string\nload(): void'
    }
    
    # 유틸리티 클래스 추가
    for name, content in utils.items():
        dot.node(name, name)
        dot.node(f'{name}_attrs', content)
        dot.edge(name, f'{name}_attrs')
        dot.edge('Client', name, 'uses')
    
    return dot

def create_dashboard_class_diagram():
    dot = graphviz.Digraph(comment='Dashboard Class Diagram')
    dot.attr(rankdir='TB')
    
    # 폰트 설정
    dot.attr('graph', fontname='Malgun Gothic')
    dot.attr('node', fontname='Malgun Gothic')
    dot.attr('edge', fontname='Malgun Gothic')
    
    # 클래스 스타일 설정
    dot.attr('node', shape='box')
    
    # 대시보드 메인 클래스
    dot.node('Dashboard', 'Dashboard')
    dot.node('Dashboard_attrs', 'app: Express\ndb: Database\nsetupRoutes(): void\nsetupMiddleware(): void\nstart(): void')
    dot.edge('Dashboard', 'Dashboard_attrs')
    
    # 라우터 클래스들
    routers = {
        'MainRouter': 'router: Router\nindex(): void\nstats(): void\nsettings(): void',
        'APIRouter': 'router: Router\ngetStats(): Promise<Stats>\nupdateSettings(): Promise<void>\ntoggleCommand(): Promise<void>'
    }
    
    # 라우터 클래스 추가
    for name, content in routers.items():
        dot.node(name, name)
        dot.node(f'{name}_attrs', content)
        dot.edge(name, f'{name}_attrs')
        dot.edge('Dashboard', name, 'uses')
    
    # 뷰 클래스들
    views = {
        'LayoutView': 'render(): string\nheader(): string\nfooter(): string',
        'StatsView': 'render(stats): string\nformatStats(): string',
        'SettingsView': 'render(settings): string\nformatSettings(): string'
    }
    
    # 뷰 클래스 추가
    for name, content in views.items():
        dot.node(name, name)
        dot.node(f'{name}_attrs', content)
        dot.edge(name, f'{name}_attrs')
        dot.edge('Dashboard', name, 'uses')
    
    return dot

def create_sequence_diagram():
    dot = graphviz.Digraph(comment='Command Execution Sequence')
    dot.attr(rankdir='LR')
    
    # 폰트 설정
    dot.attr('graph', fontname='Malgun Gothic')
    dot.attr('node', fontname='Malgun Gothic')
    dot.attr('edge', fontname='Malgun Gothic')
    
    # 액터와 컴포넌트
    components = {
        'User': '사용자',
        'Discord': 'Discord API',
        'Bot': '봇 서버',
        'Command': '명령어 핸들러',
        'Database': '데이터베이스',
        'Dashboard': '웹 대시보드'
    }
    
    # 컴포넌트 추가
    for name, desc in components.items():
        dot.node(name, desc)
    
    # 명령어 실행 시퀀스
    dot.edge('User', 'Discord', '명령어 입력')
    dot.edge('Discord', 'Bot', '이벤트 발생')
    dot.edge('Bot', 'Command', '명령어 처리')
    dot.edge('Command', 'Database', '데이터 조회/저장')
    dot.edge('Command', 'Discord', '응답 전송')
    dot.edge('Discord', 'User', '결과 표시')
    dot.edge('Dashboard', 'Database', '설정 관리')
    
    return dot

def main():
    # 클래스 다이어그램 생성
    bot_diagram = create_bot_class_diagram()
    bot_diagram.render('bot_class_diagram', format='png', cleanup=True)
    
    dashboard_diagram = create_dashboard_class_diagram()
    dashboard_diagram.render('dashboard_class_diagram', format='png', cleanup=True)
    
    # 시퀀스 다이어그램 생성
    sequence_diagram = create_sequence_diagram()
    sequence_diagram.render('sequence_diagram', format='png', cleanup=True)
    
    print("UML 다이어그램이 생성되었습니다:")
    print("- bot_class_diagram.png: 봇 클래스 구조")
    print("- dashboard_class_diagram.png: 대시보드 클래스 구조")
    print("- sequence_diagram.png: 명령어 실행 시퀀스")

if __name__ == '__main__':
    main() 