// Supabase 데이터베이스 연결 및 관리
// 이 파일은 모든 데이터베이스 작업을 위한 중앙 집중식 관리를 제공합니다

// Supabase 설정 (실제 사용 시 환경변수로 관리해야 합니다)
const SUPABASE_URL = 'https://yanthcxoctifnhpekzgg.supabase.co'; // 실제 Supabase URL로 변경
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnRoY3hvY3RpZm5ocGVremdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MDg2MTUsImV4cCI6MjA2NzI4NDYxNX0.8kEkPCfQQ_NXmQhgazmud2YbR1RYDwon7OPJJTRopzo'; // 실제 Supabase anon key로 변경

// Supabase 클라이언트 초기화
let supabaseClient = null;

// Supabase 클라이언트 초기화 함수
async function initSupabase() {
    if (!supabaseClient) {
        // CDN에서 Supabase 클라이언트 로드
        if (typeof supabase === 'undefined') {
            console.warn('Supabase 라이브러리가 로드되지 않았습니다. 로컬 저장소 모드로 실행됩니다.');
            return null;
        }
        try {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } catch (error) {
            console.warn('Supabase 연결 실패, 로컬 저장소 모드로 실행됩니다:', error);
            return null;
        }
    }
    return supabaseClient;
}

// 데이터베이스 매니저 클래스 (멀티 테넌트 지원)
class DatabaseManager {
    constructor() {
        this.client = null;
        this.currentDomain = null;
        this.init();
    }

    async init() {
        try {
            this.client = await initSupabase();
            // 도메인 매니저가 있으면 현재 도메인 설정
            if (typeof domainManager !== 'undefined') {
                this.currentDomain = domainManager.getCurrentDomain();
            }
        } catch (error) {
            console.error('Supabase 초기화 오류:', error);
            // 오류 시 로컬스토리지로 폴백
            this.client = null;
        }
    }

    // 현재 도메인 설정
    setCurrentDomain(domain) {
        this.currentDomain = domain;
    }

    // 현재 도메인 가져오기
    getCurrentDomain() {
        return this.currentDomain;
    }

    // 회사 관리 (Companies)
    async getCompanies() {
        if (this.client) {
            try {
                const { data, error } = await this.client
                    .from('companies')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('회사 목록 조회 오류:', error);
            }
        }
        
        // 로컬 저장소 폴백
        return JSON.parse(localStorage.getItem('companies') || '[]');
    }

    async createCompany(companyData) {
        const company = {
            company_name: companyData.companyName || companyData.company_name,
            domain: companyData.domain,
            website: companyData.website || '',
            email: companyData.email || '',
            phone: companyData.phone || '',
            address: companyData.address || '',
            subscription_plan: companyData.subscription_plan || 'basic',
            is_active: true,
            created_at: new Date().toISOString()
        };

        if (this.client) {
            try {
                const { data, error } = await this.client
                    .from('companies')
                    .insert([company])
                    .select();
                
                if (error) throw error;
                return { success: true, data: data[0] };
            } catch (error) {
                console.error('회사 생성 오류:', error);
            }
        }
        
        // 로컬 저장소 폴백
        const companies = JSON.parse(localStorage.getItem('companies') || '[]');
        company.id = Date.now();
        companies.push(company);
        localStorage.setItem('companies', JSON.stringify(companies));
        return { success: true, data: company };
    }

    async updateCompany(domain, updateData) {
        if (this.client) {
            try {
                const { data, error } = await this.client
                    .from('companies')
                    .update(updateData)
                    .eq('domain', domain)
                    .select();
                
                if (error) throw error;
                return { success: true, data: data[0] };
            } catch (error) {
                console.error('회사 업데이트 오류:', error);
            }
        }
        
        // 로컬 저장소 폴백
        const companies = JSON.parse(localStorage.getItem('companies') || '[]');
        const companyIndex = companies.findIndex(c => c.domain === domain);
        if (companyIndex !== -1) {
            companies[companyIndex] = { ...companies[companyIndex], ...updateData };
            localStorage.setItem('companies', JSON.stringify(companies));
            return { success: true, data: companies[companyIndex] };
        }
        return { success: false, error: '회사를 찾을 수 없습니다.' };
    }

    async deleteCompany(domain) {
        if (this.client) {
            try {
                const { error } = await this.client
                    .from('companies')
                    .delete()
                    .eq('domain', domain);
                
                if (error) throw error;
                return { success: true };
            } catch (error) {
                console.error('회사 삭제 오류:', error);
                return { success: false, error: error.message };
            }
        }
        
        // 로컬 저장소 폴백
        const companies = JSON.parse(localStorage.getItem('companies') || '[]');
        const filteredCompanies = companies.filter(c => c.domain !== domain);
        localStorage.setItem('companies', JSON.stringify(filteredCompanies));
        return { success: true };
    }

    // 사용자 관리 (Users)
    async getUsers(companyDomain = null) {
        if (this.client) {
            try {
                let query = this.client.from('users').select('*');
                
                if (companyDomain) {
                    query = query.eq('company_domain', companyDomain);
                }
                
                const { data, error } = await query.order('created_at', { ascending: false });
                
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('사용자 목록 조회 오류:', error);
            }
        }
        
        // 로컬 저장소 폴백
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (companyDomain) {
            return users.filter(u => u.company_domain === companyDomain);
        }
        return users;
    }

    async createUser(userData) {
        const user = {
            username: userData.username || userData.email,
            email: userData.email,
            password: userData.password,
            name: userData.name,
            phone: userData.phone || '',
            department: userData.department || '',
            position: userData.position || '',
            role: userData.role || 'employee',
            company_domain: userData.company_domain || this.currentDomain,
            is_active: true,
            created_at: new Date().toISOString()
        };

        if (this.client) {
            try {
                const { data, error } = await this.client
                    .from('users')
                    .insert([user])
                    .select();
                
                if (error) throw error;
                return { success: true, data: data[0] };
            } catch (error) {
                console.error('사용자 생성 오류:', error);
                return { success: false, error: error.message };
            }
        }
        
        // 로컬 저장소 폴백
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        user.id = Date.now();
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
        
        // 회원가입용 별도 저장소에도 저장
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        registeredUsers.push(user);
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
        
        return { success: true, data: user };
    }

    async updateUser(userId, updateData) {
        if (this.client) {
            try {
                const { data, error } = await this.client
                    .from('users')
                    .update(updateData)
                    .eq('id', userId)
                    .select();
                
                if (error) throw error;
                return { success: true, data: data[0] };
            } catch (error) {
                console.error('사용자 업데이트 오류:', error);
                return { success: false, error: error.message };
            }
        }
        
        // 로컬 저장소 폴백
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id == userId);
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updateData };
            localStorage.setItem('users', JSON.stringify(users));
            return { success: true, data: users[userIndex] };
        }
        return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }

    async deleteUser(userId) {
        if (this.client) {
            try {
                const { error } = await this.client
                    .from('users')
                    .delete()
                    .eq('id', userId);
                
                if (error) throw error;
                return { success: true };
            } catch (error) {
                console.error('사용자 삭제 오류:', error);
                return { success: false, error: error.message };
            }
        }
        
        // 로컬 저장소 폴백
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const filteredUsers = users.filter(u => u.id != userId);
        localStorage.setItem('users', JSON.stringify(filteredUsers));
        return { success: true };
    }

    // 업무 일지 관리 (Work Logs)
    async getWorkLogs(userId = null, startDate = null, endDate = null) {
        const key = `workLogs_${userId || 'all'}`;
        
        if (this.client) {
            try {
                let query = this.client.from('work_logs').select('*');
                
                if (userId) query = query.eq('user_id', userId);
                if (startDate) query = query.gte('work_date', startDate);
                if (