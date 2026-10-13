import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="nf">
      <p className="num">404</p>
      <h1 className="tt">Такой клетки в шахматке нет</h1>
      <p className="note">Страница переехала или ещё не построена. Попробуйте поиск по ЖК, адресу участка или застройщику.</p>
      <form className="nf-search" action="/poisk/" role="search">
        <label htmlFor="q-nf" className="sr">Поиск</label>
        <input id="q-nf" name="q" type="search" placeholder="Например, Волжский парк" />
      </form>
      <Link className="btn" href="/">На главную</Link>
    </section>
  )
}
