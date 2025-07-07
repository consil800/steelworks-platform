// 업체 등록 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // 로그인 확인
    const currentUser = AuthManager.getCurrentUser();
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
    }

    const form = document.getElementById('companyForm');
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    // 폼 제출 이벤트
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const companyData = {
            company_name: formData.get('companyName').trim(),
            region: formData.get('region').trim(),
            address: formData.get('address').trim(),
            phone: formData.get('phone').trim(),
            contact_person: formData.get('contactPerson').trim(),
            mobile: formData.get('mobile').trim(),
            email: formData.get('email').trim(),
            payment_terms: formData.get('paymentTerms').trim(),
            debt_amount: formData.get('debtAmount').trim(),
            business_type: formData.get('businessType').trim(),
            products: formData.get('products').trim(),
            usage_items: formData.get('usageItems').trim(),
            notes: formData.get('notes').trim(),
            company_color: formData.get('companyColor') || '',
            visit_count: 0,
            last_visit_date: null,
            user_id: currentUser.id,
            company_domain: currentUser.company_domain || 'namkyungsteel.com'
        };

        // 필수 필드 검증
        if (!companyData.company_name) {
            alert('업체명을 입력해주세요.');
            document.getElementById('companyName').focus();
            return;
        }

        if (!companyData.region) {
            alert('지역을 입력해주세요.');
            document.getElementById('region').focus();
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = '등록 중...';

            // 데이터베이스에 저장 (개인 업체로)
            if (window.db && window.db.client) {
                const result = await window.db.createClientCompany(companyData);
                
                if (result.success) {
                    alert('업체가 성공적으로 등록되었습니다.');
                    // worklog.html로 돌아가기
                    window.location.href = 'worklog.html';
                } else {
                    throw new Error('업체 등록에 실패했습니다.');
                }
            } else {
                throw new Error('데이터베이스 연결이 필요합니다.');
            }

        } catch (error) {
            console.error('업체 등록 오류:', error);
            alert('업체 등록 중 오류가 발생했습니다: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '등록';
        }
    });

    // 취소 버튼
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            if (confirm('작성 중인 내용이 사라집니다. 정말로 취소하시겠습니까?')) {
                window.location.href = 'worklog.html';
            }
        });
    }

    // 컬러 선택 미리보기 (있다면)
    const colorInputs = document.querySelectorAll('input[name="companyColor"]');
    colorInputs.forEach(input => {
        input.addEventListener('change', function() {
            // 컬러 미리보기 기능 (옵션)
            console.log('선택된 색상:', this.value);
        });
    });
});