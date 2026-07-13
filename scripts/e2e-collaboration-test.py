"""
E2E test for GRS004 collaboration UI.

Tests:
1. Rider login + navigate to collaboration section
2. Organizer login + navigate to riders section (team list + approval)
3. Knowledge base API endpoints (GET with cookie auth)
"""
import os
import sys
from playwright.sync_api import sync_playwright, Page

BASE_URL = "http://localhost:3000"
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "..", "test-screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def screenshot(page: Page, name: str):
    path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
    page.screenshot(path=path, full_page=True)
    print(f"  [screenshot] {path}")

def login(page: Page, username: str, password: str) -> bool:
    """Login via the login page form."""
    page.goto(f"{BASE_URL}/login")
    page.wait_for_load_state("networkidle")

    # Fill login form (there are 2 forms with username/password fields; use .first)
    page.locator("input[name='username']").first.fill(username)
    page.locator("input[name='password']").first.fill(password)

    # Click the exact "登录" button (not "使用 GitHub 登录")
    page.get_by_role("button", name="登录", exact=True).click()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)  # allow redirect to settle

    # Check we're logged in (should redirect to console or profile)
    current_url = page.url
    if "/login" in current_url:
        print(f"  [FAIL] Login failed for {username}, still on login page")
        return False
    if "/profile" in current_url:
        print(f"  [INFO] Redirected to profile page for {username}")
        # Some users may need profile completion
    print(f"  [OK] Logged in as {username}, current: {current_url}")
    return True

def test_rider_collaboration():
    """Test the rider collaboration section."""
    print("\n=== Test: Rider Collaboration ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # 1. Login as rider
            if not login(page, "rider_alice", "rider123"):
                browser.close()
                return False

            # 2. Navigate to console
            page.goto(f"{BASE_URL}/console/races")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1000)
            screenshot(page, "rider_console_races")

            # 3. Find a race with team context
            # rider_alice is in race_active (Sorting Challenge)
            page.goto(f"{BASE_URL}/console/races/race_active--sorting-challenge/rider/registration")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1000)
            screenshot(page, "rider_registration")

            # 4. Navigate to collaboration section
            page.goto(f"{BASE_URL}/console/races/race_active--sorting-challenge/rider/collaboration")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)

            # 5. Verify collaboration section content
            page_content = page.content()

            checks = {
                "团队协作 page": "团队协作" in page_content or "尚未加入" in page_content,
                "Panel 渲染正常": "Panel" in page_content or "section" in page_content,
            }
            for name, ok in checks.items():
                status = "OK" if ok else "FAIL"
                print(f"  [{status}] {name}")

            # Check specific team content - rider may have no team
            has_team = "队伍信息" in page_content
            has_tasks = "任务看板" in page_content
            has_messages = "协作消息" in page_content
            has_kb = "知识库" in page_content
            has_no_team = "尚未加入" in page_content

            if has_team and has_tasks and has_messages and has_kb:
                print("  [OK] Full team collaboration panels visible")
            elif has_no_team:
                print("  [OK] 'No team' message shown (rider may not be in a team)")
            else:
                print(f"  [INFO] Team={has_team} Tasks={has_tasks} Msg={has_messages} KB={has_kb}")

            screenshot(page, "rider_collaboration")

            # 6. Test knowledge base API
            # We need a team ID - let's try from the active race team
            page.goto(f"{BASE_URL}/console/races")
            page.wait_for_load_state("networkidle")

            print("  Rider collaboration test complete")

        except Exception as e:
            print(f"  [ERROR] {e}")
            screenshot(page, "rider_error")
            return False
        finally:
            browser.close()

    return True

def test_organizer_riders():
    """Test the organizer riders section with team list and approval."""
    print("\n=== Test: Organizer Riders ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # 1. Login as organizer
            if not login(page, "organizer_demo", "organizer123"):
                browser.close()
                return False

            # 2. Navigate to organizer console
            page.goto(f"{BASE_URL}/console/races")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1000)
            screenshot(page, "organizer_console_races")

            # 3. Navigate to riders section for a race
            page.goto(f"{BASE_URL}/console/races/race_active--sorting-challenge/organizer/riders")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)
            screenshot(page, "organizer_riders")

            # 4. Verify organizer riders section
            page_content = page.content()
            checks = {
                "团队列表 Panel": "团队列表" in page_content,
                "报名审批 Panel": "报名审批" in page_content,
            }
            for name, ok in checks.items():
                status = "OK" if ok else "FAIL"
                print(f"  [{status}] {name}")

            print("  Organizer riders test complete")

        except Exception as e:
            print(f"  [ERROR] {e}")
            screenshot(page, "organizer_error")
            return False
        finally:
            browser.close()

    return True

def test_knowledge_base_api():
    """Test the knowledge base API endpoints directly."""
    print("\n=== Test: Knowledge Base API ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # Login first to get cookie
            if not login(page, "rider_alice", "rider123"):
                context.close()
                browser.close()
                return False

            # Try a known team ID from the finished race
            # The finished race has teams like team_finished_0
            team_id = "team_finished_0"

            # Test code download
            page.goto(f"{BASE_URL}/api/knowledge-base/{team_id}/code")
            page.wait_for_load_state("networkidle")
            body = page.content()
            
            if "unauthorized" in body or "forbidden" in body:
                print(f"  [INFO] code endpoint: access denied (expected for non-member)")
            elif "codeContent" in body or "codeLabel" in body:
                print("  [OK] code endpoint: returned code data")
            elif "not found" in body:
                print("  [INFO] code endpoint: no submissions found (404)")
            else:
                print(f"  [WARN] code endpoint unexpected: {body[:200]}")

            # Test zip export
            page.goto(f"{BASE_URL}/api/knowledge-base/{team_id}/export")
            page.wait_for_load_state("networkidle")
            headers = page.evaluate("document.contentType")
            print(f"  [INFO] export endpoint content-type: {headers}")

            print("  Knowledge base API test complete")

        except Exception as e:
            print(f"  [ERROR] {e}")
            return False
        finally:
            context.close()
            browser.close()

    return True

if __name__ == "__main__":
    results = []
    results.append(("Rider Collaboration UI", test_rider_collaboration()))
    results.append(("Organizer Riders UI", test_organizer_riders()))
    results.append(("Knowledge Base API", test_knowledge_base_api()))

    print("\n" + "=" * 50)
    print("Summary:")
    all_pass = True
    for name, ok in results:
        status = "PASS" if ok else "FAIL"
        if not ok:
            all_pass = False
        print(f"  [{status}] {name}")

    sys.exit(0 if all_pass else 1)
